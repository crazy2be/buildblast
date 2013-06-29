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

var globalGame = NewGame()

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

	c := NewClient(name)
	globalGame.Connect(c)

	conn := NewConn(ws)
	c.Run(conn)
}

func chunkSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())

	// TODO: findUserByName is not thread safe!
	c := globalGame.clientWithID(name)
	c.RunChunks(NewConn(ws), globalGame.world)
}

func doProfile() {
	f, err := os.Create("cpuprofile")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)

	go func () {
		cycles := 4
		for i := 0; i < cycles; i++ {
			log.Print((cycles - i) * 30, " seconds left")
			<-time.After(30*time.Second)
		}
		pprof.StopCPUProfile()
		log.Print("Done! Exiting...")
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
		state.AppendHistory(cmd)
		if err != nil {
			fmt.Println()
			log.Println("ERROR:", err)
			quit <- true
			return
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
	go globalGame.Run()

	http.HandleFunc("/", handler)
	http.Handle("/sockets/main/", websocket.Handler(mainSocketHandler))
	http.Handle("/sockets/chunk/", websocket.Handler(chunkSocketHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
