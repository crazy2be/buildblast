package main

import (
	"os"
	"os/signal"
	"fmt"
	"log"
	"time"
	"strings"
	"net/http"
	"runtime"
	"runtime/pprof"

	"code.google.com/p/go.net/websocket"
	"github.com/sbinet/liner"
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
	c := NewClient(globalWorld, name)
	c.Run(NewConn(ws))
}

func chunkSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())
	c := globalWorld.FindClient(name)
	c.RunChunks(NewConn(ws))
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

func setupPrompt() {
	quit := make(chan bool)

	c := make(chan os.Signal, 1)
	signal.Notify(c, os.Interrupt)

	state := liner.NewLiner()
	go promptLoop(quit, state)

	go func() {
		<-c
		fmt.Println()
		quit <- true
	}()

	go func() {
		<-quit
		state.Close()
		os.Exit(0)
	}()
}

func promptLoop(quit chan bool, state *liner.State) {
	for {
		cmd, err := state.Prompt(" >>> ")
		if err != nil {
			fmt.Println()
			log.Println("ERROR:", err)
			quit <- true
			return
		}
		if HandleServerCommand(cmd) {
			continue
		}
		if cmd == "exit" {
			quit <- true
			return
		}
	}
}

func main() {
	setupPrompt()

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
