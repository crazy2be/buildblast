package main

import (
	"os"
	"log"
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

func getClientName(config *websocket.Config) string {
	path := config.Location.Path
	bits := strings.Split(path, "/")
	if len(bits) < 4 {
		return ""
	}
	return bits[3]
}

func mainSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())
	p := NewClient(globalWorld, name)
	p.Run(NewConn(ws))
}

func chunkSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())
	p := globalWorld.FindClient(name)
	p.RunChunks(NewConn(ws))
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
	http.Handle("/sockets/main/", websocket.Handler(mainSocketHandler))
	http.Handle("/sockets/chunk/", websocket.Handler(chunkSocketHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
