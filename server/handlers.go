package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"code.google.com/p/go.net/websocket"

	"buildblast/lib/game"
	"buildblast/lib/vmath"
)

var globalGame *Game

func handler(w http.ResponseWriter, r *http.Request, clientLoc string) {
	// Workaround for Quentin's system configuration.
	// For some reason, css files are getting served
	// without a content-type...
	if strings.HasSuffix(r.URL.Path, ".css") {
		w.Header().Set("Content-Type", "text/css")
	}

	http.ServeFile(w, r, clientLoc+r.URL.Path)
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

	authResponse, authErr := Authenticate(ws)
	var authMessage string
	authed := authErr == nil

	if authed {
		authMessage = "Welcome " + authResponse.Name + "!"
	} else {
		log.Println(authErr)
		authMessage = authErr.Message
	}

	var baseName string
	if authed {
		baseName = authResponse.Name
	} else {
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

	// FIXME: We could give the client their entity's
	// actual initial state as part of the handshake,
	// but it's currently impossible since the entity
	// isn't yet created at the handshake stage.
	info := makePlayerEntityCreatedMessage(game.EntityId(name), game.BioticState{})

	conn.Send(&MsgHandshakeReply{
		ServerTime:       float64(time.Now().UnixNano()) / 1e6,
		ClientID:         name,
		PlayerEntityInfo: *info,
		Authenticated:    authed,
		AuthMessage:      authMessage,
	})

	client.Run(conn)
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

func protoDebugSocketHandler(ws *websocket.Conn) {
	conn := NewConn(ws)

	for {
		data, err := conn.RecvProto()
		if err != nil {
			log.Println("Error", err)
			return
		}
		if data[0] == 0 {
			log.Println("Got data:", data)
			message := "Hello, world! こんにちは世界! 𠜎"
			sendThis := make([]byte, 1)
			sendThis[0] = 0
			sendThis = append(sendThis, message...)
			conn.SendProto(sendThis)

			vec := vmath.Vec3{
				X: 1,
				Y: 11,
				Z: 111,
			}
			sendToo := make([]byte, 1)
			sendToo[0] = 1
			sendToo = append(sendToo, vec.ToProto()...)
			conn.SendProto(sendToo)
		} else {
			log.Println("Got more data:", data)
			vec := vmath.Vec3{}
			vec.FromProto(data[1:])
			log.Println("Vector!", vec.X, vec.Y, vec.Z)
		}
	}
}
