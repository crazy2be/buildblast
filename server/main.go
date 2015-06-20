package main

import (
	"flag"
	"fmt"
	"log"
	"net/http"
	"os"
	"runtime"
	"runtime/pprof"
	"time"

	"code.google.com/p/go.net/websocket"

	"buildblast/server/lib/game"
	"buildblast/server/lib/mapgen/maps"
	"buildblast/server/lib/persist"
	"buildblast/server/lib/proto"
	"buildblast/shared/util"
)

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

func main() {
	// setupPrompt()
	setupSigInt() // Print newline on SIG_INT
	configPath := flag.String("config", "server_config.json", "Path to server config")
	flag.Parse()
	config := util.LoadServerConfig(*configPath)

	runtime.GOMAXPROCS(runtime.NumCPU())

	// Set up the world
	var world *game.World
	generator := maps.NewSimplexHills(time.Now().Unix())
	if config.PersistEnabled {
		log.Println("Running with persist ENABLED. Loading world from", config.WorldBaseDir)
		persister := persist.New(config.WorldBaseDir, generator)
		world = game.NewWorld(persister.MapGenerator())
		persister.ListenForChanges(world)
	} else {
		log.Println("Running with persist DISABLED. Changes to the world will not be saved.")
		world = game.NewWorld(generator)
	}
	globalGame = NewGame(world)

	go globalGame.Run()

	// Uncomment this to run a quick profile.
	// 	go doProfile()

	// Generate our protocol and make it available for clients to download
	protoJs := proto.GenerateJs()
	http.HandleFunc("/js/proto.js", func(w http.ResponseWriter, r *http.Request) {
		headers := w.Header()
		headers["Content-Type"] = []string{"application/javascript; charset=utf-8"}
		fmt.Fprint(w, protoJs)
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, config.ClientAssets)
	})
	http.Handle("/sockets/main/", websocket.Handler(mainSocketHandler))
	http.Handle("/sockets/chunk/", websocket.Handler(chunkSocketHandler))

	err := http.ListenAndServe(config.Host+":"+config.ServerPort, nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
