package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os/exec"
	"runtime"
	"strconv"
	"sync"
)

var BASE_PORT = 10000

var globalServerMap = NewServerMap()

type ServerMap struct {
	servers map[int]*exec.Cmd
	mutex   sync.Mutex
}

func (sm *ServerMap) Put(id int, handle *exec.Cmd) {
	sm.mutex.Lock()
	sm.servers[id] = handle
	sm.mutex.Unlock()
}

func NewServerMap() *ServerMap {
	return &ServerMap{
		servers: make(map[int]*exec.Cmd),
	}
}

type ApiCreateServer struct {
	Id int `json:",string"`
}

func runServer(id int) {
	app := "./server"

	arg0 := "-client"
	arg1 := "client"
	arg2 := "-host"
	arg3 := ":" + strconv.Itoa(BASE_PORT+id)

	cmd := exec.Command(app, arg0, arg1, arg2, arg3)
	globalServerMap.Put(id, cmd)
	err := cmd.Run()

	if err != nil {
		log.Println(err.Error())
	}
}

func startServerHandler(w http.ResponseWriter, r *http.Request) {
	var server ApiCreateServer
	err := json.NewDecoder(r.Body).Decode(&server)
	if err != nil {
		log.Println("Error when starting server.", err)
	}

	go runServer(server.Id)
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	http.HandleFunc("/", startServerHandler)

	err := http.ListenAndServe(":3001", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
