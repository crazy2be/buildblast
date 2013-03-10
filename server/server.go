package main

import (
	"io"
	"os"
	"log"
	"fmt"
	"time"
	"strings"
	"net/http"
	"runtime/pprof"
	"code.google.com/p/go.net/websocket"
)

type Conn struct {
	ws *websocket.Conn
}

func NewConn(ws *websocket.Conn) *Conn {
	c := new(Conn)
	c.ws = ws
	return c
}

func (c *Conn) Send(m *Message) {
	err := websocket.JSON.Send(c.ws, m)
	if err != nil {
		log.Print("Sending websocket message: ", err)
		return
	}
}

func (c *Conn) Recv() *Message {
	m := new(Message)
	err := websocket.JSON.Receive(c.ws, m)
	if err != nil {
		if err != io.EOF {
			log.Print("Reading websocket message: ", err)
		}
		return nil
	}
	return m
}

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
	log.Print("Chunk handler:", name, p)

	for {
		var ms *Message
		select {
		case ms = <-p.cm.messages:
		case <-time.After(100*time.Millisecond):
			cc, valid := p.cm.top()
			if !valid {
				continue
			}
			ms = NewMessage("chunk")
			ms.Payload["ccpos"] = cc.toMap()
			ms.Payload["size"] = map[string]interface{}{
				"w": CHUNK_WIDTH,
				"h": CHUNK_HEIGHT,
				"d": CHUNK_DEPTH,
			}

			chunk := p.w.RequestChunk(cc)
			ms.Payload["data"] = chunk.Flatten()
		}
		log.Print("Sending chunk message of kind ", ms.Kind, " at ", ms.Payload["ccpos"])
		err := websocket.JSON.Send(ws, ms)
		if err != nil {
			log.Print("Sending chunk websocket message (", p.name, "): ", err)
			return
		}
	}
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
	go globalWorld.Run()
	http.HandleFunc("/", handler)
	http.Handle("/ws/new", websocket.Handler(wsHandler))
	http.Handle("/ws/chunks/", websocket.Handler(chunkHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
