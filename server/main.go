package main

import (
	"fmt"
	"log"
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

func mainSocketHandler(ws *websocket.Conn) {
	conn := NewConn(ws)
	clientChan := make(chan *Client)
	go func() {
		clientChan <- doHandshake(conn)
	}()
	
	select {
	case client := <-clientChan:
		client.Run(conn)
	case <-time.After(time.Second):
		fatalExitChan <- "Client connection timeout."
	}
}

func doHandshake(conn *Conn) *Client {
	msg, err := conn.Recv()
	if err != nil {
		log.Println("Error connecting client, unable to read handshake message: ", err)
		return nil
	}

	baseName := msg.(*MsgHandshakeInit).DesiredName
	if baseName == "" {
		baseName = "guest"
	}

	name := baseName
	nameNumber := 1
	var client *Client
	for {
		var isNew bool
		client, isNew = globalGame.clientWithID(name)
		if isNew {
			break
		}
		name = fmt.Sprintf("%s-%d", baseName, nameNumber)
		nameNumber++
	}

	conn.Send(&MsgHandshakeReply{
		ServerTime: float64(time.Now().UnixNano()) / 1e6,
		ClientID:   name,
	})
	return client
}

func chunkSocketHandler(ws *websocket.Conn) {
	name := getClientName(ws.Config())

	client, isNew := globalGame.clientWithID(name)
	if isNew {
		log.Println("Warning: Attempt to connect to chunk socket for client '" + name + "' who is not connected on main socket!")
		globalGame.Disconnect(name, "invalid connection")
		return
	}
	client.RunChunks(NewConn(ws))
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

func fatalExit() {
	reason := <- fatalExitChan
	panic(reason)
}

var fatalExitChan chan string

func main() {
	fatalExitChan = make(chan string)
	go fatalExit()
// 	setupPrompt()

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
