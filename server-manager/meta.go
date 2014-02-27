package main

import (
	"os"
	"encoding/json"
	"io/ioutil"
	"log"
	"path"
)

var META_VERSION = 1

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
	globalServerMap.Put(&server)
	go server.run()
}