package main

import (
	"fmt"
	"log"
	"net/http"
	"strings"
	"time"

	"github.com/gorilla/websocket"

	"buildblast/server/lib/game"
	"buildblast/server/lib/proto"
	"buildblast/shared/db"
	"buildblast/shared/util"
)

var globalGame *Game

var upgrader = websocket.Upgrader{
	ReadBufferSize:  1024,
	WriteBufferSize: 1024,
	CheckOrigin: func(r *http.Request) bool {
		return true
	},
}

func handler(w http.ResponseWriter, r *http.Request, clientLoc string) {
	// Workaround for Quentin's system configuration.
	// For some reason, css files are getting served
	// without a content-type...
	if strings.HasSuffix(r.URL.Path, ".css") {
		w.Header().Set("Content-Type", "text/css")
	}
	w.Header().Add("Cache-Control", "max-age=300, public, must-revalidate, proxy-revalidate")

	http.ServeFile(w, r, clientLoc+r.URL.Path)
}

func getClientName(r *http.Request) string {
	bits := strings.Split(r.URL.Path, "/")
	if len(bits) < 4 {
		return ""
	}
	return bits[3]
}

func mainSocketHandler(w http.ResponseWriter, r *http.Request) {
	var account db.Account
	authenticated := false
	if dbc != nil {
		cj := util.NewCookieJar(w, r, config.CookieKeyPairs...)
		account, _, authenticated = cj.Authenticate(dbc)
		cj.SaveSession()
	}

	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Couldn't upgrade websocket:", err)
	}

	conn := NewConn(wsConn)

	var baseName string
	if authenticated {
		baseName = account.Username
	} else {
		baseName = "guest"
	}

	name := baseName
	nameNumber := 1
	var client *Client
	for {
		var isNew bool
		client, isNew = globalGame.clientWithId(name)
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
	info := makePlayerEntityCreatedMessage(game.EntityId(name), &game.BioticState{})

	conn.Send(&proto.MsgHandshakeReply{
		ServerTime:       float64(time.Now().UnixNano()) / 1e6,
		ClientId:         name,
		PlayerEntityInfo: *info,
	})

	client.Run(conn)
}

func chunkSocketHandler(w http.ResponseWriter, r *http.Request) {
	name := getClientName(r)

	wsConn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		fmt.Println("Couldn't upgrade websocket:", err)
	}

	client, isNew := globalGame.clientWithId(name)
	if isNew {
		log.Println("Warning: Attempt to connect to chunk socket for client '" + name + "' who is not connected on main socket!")
		globalGame.Disconnect(name, "invalid connection")
		return
	}
	client.RunChunks(NewConn(wsConn))
}
