package main

import (
	"log"
	"net/http"
	"code.google.com/p/go.net/websocket"
)

func handler(w http.ResponseWriter, r *http.Request) {
	http.ServeFile(w, r, "." + r.URL.Path)
}

type ChunkRequest struct {
	CX int
	CY int
	CZ int
	Seed float64
}

type ChunkResponse struct {
	CX int
	CY int
	CZ int
	Data Chunk
}

func wsHandler(ws *websocket.Conn) {
	for {
		req := new(ChunkRequest)
		err := websocket.JSON.Receive(ws, req)
		if err != nil {
			panic(err)
		}
		
		chunk := generateChunk(req.CX, req.CY, req.CZ, req.Seed)
		
		resp := &ChunkResponse{
			CX: req.CX,
			CY: req.CY,
			CZ: req.CZ,
			Data: chunk,
		}
		err = websocket.JSON.Send(ws, resp)
		if err != nil {
			panic(err)
		}
	}
}

func main() {
	http.HandleFunc("/", handler)
	http.Handle("/ws", websocket.Handler(wsHandler))
	err := http.ListenAndServe(":8080", nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}