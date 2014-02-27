package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
)

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
	globalServerMap.Put(server)
	go server.run()
}

func deleteHandler(w http.ResponseWriter, r *http.Request) {
	request, err := parseGenericRequest(r)
	if err != nil {
		http.Error(w, err.Error(), 500)
		return
	}

	server := globalServerMap.Remove(request.ServerId)
	err = stop(server.Handle.Process)
	if err != nil {
		return
	}
	globalPortMapper.freePort(server.PortOffset)
	os.RemoveAll(worldDir(server.Id))
}
