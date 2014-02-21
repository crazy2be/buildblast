package main

import (
	"flag"
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"sync"
)

var BASE_PORT = 10000
var globalWorldBaseDir string
var globalServerMap = NewServerMap()

type Server struct {
	id int
	creatorId int
	name string
	portOffset int
	handle *exec.Cmd
}

func NewServer(creatorId int, name string) *Server {
	// TODO Generate an id and port offset
	return &Server{
		creatorId: creatorId,
		name: name,
	}
}

type ServerMap struct {
	servers map[int]Server
	mutex   sync.Mutex
}

func (sm *ServerMap) Put(server Server) {
	sm.mutex.Lock()
	sm.servers[server.id] = server
	sm.mutex.Unlock()
}

func NewServerMap() *ServerMap {
	return &ServerMap{
		servers: make(map[int]Server),
	}
}

func runServer(server *Server) {
	app := "./server"

	arg0 := "-client"
	arg1 := "client"
	arg2 := "-world"
	arg3 := globalWorldBaseDir+"world"+strconv.Itoa(server.id)
	arg4 := "-host"
	arg5 := ":" + strconv.Itoa(BASE_PORT+server.id)

	cmd := exec.Command(app, arg0, arg1, arg2, arg3, arg4, arg5)
	server.handle = cmd
	globalServerMap.Put(*server)
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

type ServerResponse struct {
	Id int
	CreatorId int
	Name string
	PortOffset int
}

func NewServerResponse(server Server) *ServerResponse {
	return &ServerResponse{
		Id: server.id,
		CreatorId: server.creatorId,
		Name: server.name,
		PortOffset: server.portOffset,
	}
}

type ServerListResponse struct {
	List map[string]ServerResponse
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

	server, found := globalServerMap.servers[request.ServerId]
	if !found {
		http.NotFound(w, r)
	}

	serverResponse := NewServerResponse(server)
	serverJson, err := json.Marshal(serverResponse)
	if err != nil {
		log.Println("Error marshalling server")
	}

	_, err = w.Write(serverJson)
	if err != nil {
		log.Println("Error sending response")
	}
}

func listHandler(w http.ResponseWriter, r *http.Request) {
}

func createHandler(w http.ResponseWriter, r *http.Request) {
	var request ApiCreate
	err := json.NewDecoder(r.Body).Decode(&request)
	if err != nil {
		log.Println("Error parsing create request", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
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
