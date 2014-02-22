package main

import (
	"flag"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"fmt"
	"sync"
	"path"
)

var BASE_PORT = 10000
var globalWorldBaseDir string
var globalServerMap = NewServerMap()

type Server struct {
	Id int
	CreatorId int
	Name string
	PortOffset int
	Handle *exec.Cmd `json:"-"`
}

func NewServer(creatorId int, name string) *Server {
	// TODO Generate an id and port offset
	return &Server{
		CreatorId: creatorId,
		Name: name,
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
	arg3 := path.Join(globalWorldBaseDir, "world" + str(server.Id))
	arg4 := "-host"
	arg5 := ":" + str(BASE_PORT+server.Id)

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

	server := NewServer(request.CreatorId, request.ServerName)
	go runServer(server)
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
}

func main() {
	worldFolder := flag.String("worlds", "worlds/", "Sets the base folder used to store the worlds.")
	flag.Parse()
	globalWorldBaseDir = *worldFolder

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
