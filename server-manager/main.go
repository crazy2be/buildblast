package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path"
	"runtime"
	"strings"
	"sync"
)

var META_VERSION = 1
var BASE_PORT = 10000
var globalWorldBaseDir string
var globalServerMap = NewServerMap()
var globalIdSequence = NewIdSequence(0)
var globalPortMapper = NewPortMapper()

type PortMapper struct {
	portSequence int
	freePorts    []int
	mutex        sync.Mutex
}

func (pm *PortMapper) getPort() int {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()
	if len(pm.freePorts) == 0 {
		result := pm.portSequence
		pm.portSequence++
		return result
	}
	result := pm.freePorts[len(pm.freePorts)-1]
	pm.freePorts = pm.freePorts[:len(pm.freePorts)-1]
	return result
}

func (pm *PortMapper) freePort(port int) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()
	pm.freePorts = append(pm.freePorts, port)
}

func NewPortMapper() *PortMapper {
	return &PortMapper{
		freePorts: make([]int, 0, 10),
	}
}

type IdSequence struct {
	nextValue int
	mutex     sync.Mutex
}

func (is *IdSequence) getId() int {
	is.mutex.Lock()
	defer is.mutex.Unlock()
	result := is.nextValue
	is.nextValue++
	return result
}

func (is *IdSequence) updateSequence(usedValue int) {
	if usedValue >= is.nextValue {
		is.nextValue = usedValue + 1
	}
}

func NewIdSequence(start int) *IdSequence {
	return &IdSequence{
		nextValue: start,
	}
}

type Server struct {
	Id         int
	CreatorId  int
	Name       string
	PortOffset int
	Handle     *exec.Cmd `json:"-"`
}

func NewServer(id int, creatorId int, name string) *Server {
	if id < 0 {
		id = globalIdSequence.getId()
	}

	serverName := strings.TrimSpace(name)
	if len(serverName) == 0 {
		serverName = "NoName-" + str(id)
	}

	return &Server{
		Id:         id,
		CreatorId:  creatorId,
		Name:       serverName,
		PortOffset: globalPortMapper.getPort(),
	}
}

type ServerMap struct {
	servers map[string]*Server
	mutex   sync.Mutex
}

func (sm *ServerMap) Put(server *Server) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	sm.servers[str(server.Id)] = server
}

func (sm *ServerMap) Get(id int) *Server {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	return sm.servers[str(id)]
}

func (sm *ServerMap) Remove(id int) *Server {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	server := sm.servers[str(id)]
	delete(sm.servers, str(id))
	return server
}

func (sm *ServerMap) Encode(w io.Writer) error {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	err := json.NewEncoder(w).Encode(sm.servers)
	return err
}

func NewServerMap() *ServerMap {
	return &ServerMap{
		servers: make(map[string]*Server),
	}
}

func runServer(server *Server) {
	app := "./server"
	args := []string{
		"-client", "client",
		"-world", worldDir(server.Id),
		"-host", ":" + str(BASE_PORT+server.PortOffset),
	}

	cmd := exec.Command(app, args...)
	server.Handle = cmd
	globalServerMap.Put(server)
	err := cmd.Run()

	if err != nil {
		log.Println("Error running the server:", err)
	}
}

type ApiGeneric struct {
	ServerId int
}

type ApiCreate struct {
	CreatorId  int
	ServerName string
}

type ServerListResponse struct {
	List map[string]Server
}

func parseGenericRequest(r *http.Request) (ApiGeneric, error) {
	var result ApiGeneric
	err := json.NewDecoder(r.Body).Decode(&result)
	if err != nil {
		log.Println("Error while parsing generic request", err)
		return result, err
	}
	return result, nil
}

func getHandler(w http.ResponseWriter, r *http.Request) {
	request, err := parseGenericRequest(r)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	server := globalServerMap.Get(request.ServerId)
	if server == nil {
		http.NotFound(w, r)
		return
	}

	err = json.NewEncoder(w).Encode(server)
	if err != nil {
		log.Println("Error marshalling server")
		http.Error(w, err.Error(), 500)
	}
}

func listHandler(w http.ResponseWriter, r *http.Request) {
	err := globalServerMap.Encode(w)
	if err != nil {
		http.Error(w, err.Error(), 500)
	}
}

func createHandler(w http.ResponseWriter, r *http.Request) {
	var request ApiCreate
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("Error parsing create request:", err, "Body:", r.Body)
		http.Error(w, err.Error(), 500)
		return
	}

	server := NewServer(-1, request.CreatorId, request.ServerName)
	saveServer(server)
	go runServer(server)
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	request, err := parseGenericRequest(r)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	server := globalServerMap.Remove(request.ServerId)
	err = server.Handle.Process.Kill()
	if err != nil {
		log.Println("Error while sending SIG_DEATH to running server", err)
	}
	_, err = server.Handle.Process.Wait()
	if err != nil {
		log.Println("Error while waiting on process.", err)
	}
	globalPortMapper.freePort(server.PortOffset)
	os.RemoveAll(worldDir(server.Id))
}

func saveServer(server *Server) {
	err := os.MkdirAll(worldDir(server.Id), 0755)
	if err != nil {
		log.Println("Error creating required directories:", err)
		return
	}

	file, err := os.Create(path.Join(worldDir(server.Id), "meta.server"))
	if err != nil {
		log.Println("Error creating file to save server:", err)
		return
	}
	defer file.Close()

	err = json.NewEncoder(file).Encode(server)
	if err != nil {
		log.Println("Error encoding meta data.", err)
	}
}

func loadServers() {
	files, err := ioutil.ReadDir(globalWorldBaseDir)
	if err != nil {
		log.Println("Error reading base world directory")
		return
	}

	for _, fileInfo := range files {
		loadServer(fileInfo)
	}
}

func loadServer(fileInfo os.FileInfo) {
	if !fileInfo.IsDir() {
		return
	}

	file, err := os.Open(path.Join(globalWorldBaseDir, fileInfo.Name(), "meta.server"))
	if err != nil {
		log.Println("Error opening server meta data:", err)
		return
	}
	defer file.Close()

	var server Server
	err = json.NewDecoder(file).Decode(&server)
	if err != nil {
		log.Println("Error while parsing meta json for", fileInfo.Name(), err)
		return
	}

	server.PortOffset = globalPortMapper.getPort()
	globalIdSequence.updateSequence(server.Id)
	go runServer(&server)
}

func main() {
	worldFolder := flag.String("worlds", "worlds/", "Sets the base folder used to store the worlds.")
	flag.Parse()
	globalWorldBaseDir = *worldFolder

	loadServers()

	runtime.GOMAXPROCS(runtime.NumCPU())

	http.HandleFunc("/get", getHandler)
	http.HandleFunc("/list", listHandler)
	http.HandleFunc("/create", createHandler)
	http.HandleFunc("/delete", deleteHandler)
	err := http.ListenAndServe(":3001", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}

// Utility function
func str(i int) string {
	return fmt.Sprintf("%d", i)
}

func worldDir(serverId int) string {
	return path.Join(globalWorldBaseDir, "world"+str(serverId))
}
