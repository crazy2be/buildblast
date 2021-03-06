package main

import (
	"encoding/json"
	"io"
	"log"
	"os"
	"os/exec"
	"strings"
	"sync"
)

type Server struct {
	Id         int
	CreatorId  int
	Name       string
	PortOffset int
	Handle     *exec.Cmd `json:"-"`
}

func (s *Server) run() {
	if s.Handle != nil {
		log.Println("Error, server already running")
	}

	app := "./server"
	args := []string{
		"-client", "client",
		"-world", worldDir(s.Id),
		"-host", ":" + str(BASE_PORT+s.PortOffset),
	}

	createWorldDir(s.Id)
	logFile, err := os.OpenFile(worldFilePath(s.Id, "log.txt"), os.O_WRONLY|os.O_APPEND|os.O_CREATE, 0666)
	if err != nil {
		log.Println("Error creating log file:", err)
		return
	}
	defer logFile.Close()

	cmd := exec.Command(app, args...)
	cmd.Stdout = logFile
	cmd.Stderr = logFile
	s.Handle = cmd
	err = cmd.Run()

	if err != nil {
		log.Println("Error running the server:", err)
	}
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
