package main

import (
	"fmt"
	"log"
	"math/rand"
	"net/http"
	"os"
	"os/signal"
	"runtime"
	"runtime/pprof"
	"strings"
	"time"

	"code.google.com/p/go.net/websocket"
	"github.com/sbinet/liner"
)

var globalGame = NewGame()

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "."+r.URL.Path)
}

func getClientName(config *websocket.Config) string {
	path := config.Location.Path
	bits := strings.Split(path, "/")
	if len(bits) < 4 {
		return ""
	}
	return bits[3]
}

func generateRandomName() string {
	lower := "abcdefghijklmnopqrstuvwxyz"
	upper := "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
	digit := "0123456789"
	alphabet := lower + upper + digit
	length := 10
	name := "guest-"
	for i := 0; i < length; i++ {
		n := rand.Intn(len(alphabet))
		name += alphabet[n:n+1]
	}
	return name
}

func mainSocketHandler(ws *websocket.Conn) {
	conn := NewConn(ws)

	msg, err := conn.Recv()
	if err != nil {
		panic(err)
	}

	name := msg.(*MsgHandshakeInit).DesiredName
	if name == "" {
		name = generateRandomName()
	}

	client := globalGame.clientWithID(name)
	if client != nil {
		conn.Send(&MsgHandshakeError{
			Message: "Client with username " + name + " is already playing on this server!",
		})
		return
	}

	conn.Send(&MsgHandshakeReply{
		ServerTime: float64(time.Now().UnixNano()) / 1e6,
		ClientID: name,
	})

	c := NewClient(name)
	globalGame.Connect(c)
	c.Run(conn)
}

func chunkSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())

	c := globalGame.clientWithID(name)
	c.RunChunks(NewConn(ws))
}

func doProfile() {
	f, err := os.Create("cpuprofile")
	if err != nil {
		log.Fatal(err)
	}
	pprof.StartCPUProfile(f)

	go func() {
		cycles := 4
		for i := 0; i < cycles; i++ {
			log.Print((cycles-i)*30, " seconds left")
			<-time.After(30 * time.Second)
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
	// 	go doProfile()

	http.HandleFunc("/", handler)
	http.Handle("/sockets/main/", websocket.Handler(mainSocketHandler))
	http.Handle("/sockets/chunk/", websocket.Handler(chunkSocketHandler))

	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
