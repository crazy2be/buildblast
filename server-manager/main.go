package main

import (
	"flag"
	"encoding/json"
	"log"
	"net/http"
	"os"
	"os/exec"
	"io/ioutil"
	"bufio"
	"runtime"
	"fmt"
	"sync"
	"path"
	"strconv"
	"strings"
)

var META_VERSION = 1
var BASE_PORT = 10000
var globalWorldBaseDir string
var globalServerMap = NewServerMap()
var globalIdSequence = NewIdSequence(0)
var globalPortMapper = NewPortMapper()

type PortMapper struct {
	portSequence int
	freePorts []int
	mutex sync.Mutex
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
	mutex sync.Mutex
}

func (is *IdSequence) getId() int {
	is.mutex.Lock()
	defer is.mutex.Unlock()
	result := is.nextValue
	is.nextValue++
	return result
}

func NewIdSequence(start int) *IdSequence {
	return &IdSequence{
		nextValue: start,
	}
}

type Server struct {
	Id int
	CreatorId int
	Name string
	PortOffset int
	Handle *exec.Cmd `json:"-"`
}

func NewServer(id int, creatorId int, name string) *Server {
	if id < 0 {
		id = globalIdSequence.getId()
	}
	return &Server{
		Id: id,
		CreatorId: creatorId,
		Name: strings.TrimSpace(name),
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

func (sm *ServerMap) Remove(id int) {
	sm.mutex.Lock()
	defer sm.mutex.Unlock()
	server := sm.servers[str(id)]
	delete(sm.servers, str(id))
	err := server.Handle.Process.Signal(os.Interrupt)
	if err != nil {
		log.Println("Error while sending SIGINT to running server", err)
	}
	globalPortMapper.freePort(server.PortOffset)
}

func (sm *ServerMap) Encode(w http.ResponseWriter) error {
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

	arg0 := "-client"
	arg1 := "client"
	arg2 := "-world"
	arg3 := worldDir(server.Id)
	arg4 := "-host"
	arg5 := ":" + str(BASE_PORT+server.PortOffset)

	cmd := exec.Command(app, arg0, arg1, arg2, arg3, arg4, arg5)
	server.Handle = cmd
	globalServerMap.Put(server)
	err := cmd.Run()

	if err != nil {
		log.Println(err.Error())
	}
}

type ApiGeneric struct {
	ServerId int
}

type ApiCreate struct {
	CreatorId int
	ServerName string
}

type ServerListResponse struct {
	List map[string]Server
}

func parseGenericRequest(r *http.Request) (ApiGeneric, error) {
	var result ApiGeneric
	err := json.NewDecoder(r.Body).Decode(&result)
	if err != nil {
		log.Println("Error while parsing generic request")
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
		log.Println("Error parsing create request", err)
		http.Error(w, err.Error(), 500)
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

	globalServerMap.Remove(request.ServerId)
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

	meta := "version:" + str(META_VERSION) + "\n" +
			"id:" + str(server.Id) + "\n" +
			"creatorId:" + str(server.CreatorId) + "\n" +
			"name:" + server.Name + "\n"

	writer := bufio.NewWriter(file)
	_, err = writer.WriteString(meta)
	if err != nil {
		log.Println("Error writing meta data.", err)
	}
	writer.Flush()
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

	var version int
	id := -1
	creatorId := -1
	var name string

	versionOkay := false

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := scanner.Text()
		components := strings.SplitN(line, ":", 2)
		if len(components) != 2 {
			log.Println("Malformed server meta data(", len(components), "):", line)
			continue
		}

		option := strings.TrimSpace(components[0])
		val := strings.TrimSpace(components[1])

		switch option {
		case "version":
			version, err = strconv.Atoi(val)
			if err != nil {
				log.Println("Error, invalid version format:", line)
				return
			}
			versionOkay = version == META_VERSION
			if !versionOkay {
				log.Println("Error, wrong meta version. Expected", META_VERSION, "got", version)
				return
			}
		case "id":
			if !versionOkay {
				log.Println("Version must be the first line in the meta data")
			}
			id, err = strconv.Atoi(val)
			if err != nil {
				log.Println("Error, invalid id format:", line)
			}
		case "creatorId":
            if !versionOkay {
                log.Println("Version must be the first line in the meta data")
            }
            creatorId, err = strconv.Atoi(val)
            if err != nil {
                log.Println("Error, invalid creatorId format:", line)
            }
		case "name":
            if !versionOkay {
                log.Println("Version must be the first line in the meta data")
            }
			name = val
		default:
			log.Println("Unknown option. You sure your version info is correct?", line)
		}
	}

	if id < 0 || creatorId < 0 || len(name) == 0 {
		log.Println("Invalid server meta data:", "id(", id, ") creatorId(", creatorId, ") name(", name, ")", fileInfo.Name())
	}

	server := NewServer(id, creatorId, name)
	go runServer(server)
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
	return path.Join(globalWorldBaseDir, "world" + str(serverId))
}
