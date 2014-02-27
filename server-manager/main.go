package main

import (
	"flag"
	"log"
	"net/http"
	"runtime"
)

var globalWorldBaseDir string
var globalServerMap = NewServerMap()
var globalIdSequence IdSequence
var globalPortMapper = NewPortMapper()

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
