package main

import (
	"os"
	"log"
	"fmt"
	"time"
	"strings"
	"net/http"
	"runtime"
	"runtime/pprof"
	"code.google.com/p/go.net/websocket"
)

var globalWorld = NewWorld(float64(time.Now().Unix()))

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}

func wsHandler(ws *websocket.Conn) {
	config := ws.Config()
	fmt.Println(config, config.Location, config.Origin)

	p := NewPlayer(globalWorld)
	p.Run(ws)
}

func chunkHandler(ws *websocket.Conn) {
	config := ws.Config();
	path := config.Location.Path
	name := strings.Split(path, "/")[3]

	p := globalWorld.FindPlayer(name)
	p.RunChunks(ws)
}

func doProfile() {
	f, err := os.Create("cpuprofile")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)

	go func () {
		for i := 1; i < 5; i++ {
			<-time.After(30*time.Second)
			log.Print(i * 30, " seconds past")
		}
		pprof.StopCPUProfile()
		os.Exit(1)
	}()
}

func main() {
	runtime.GOMAXPROCS(runtime.NumCPU())
	go globalWorld.Run()

	http.HandleFunc("/", handler)
	http.Handle("/ws/new", websocket.Handler(wsHandler))
	http.Handle("/ws/chunks/", websocket.Handler(chunkHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
