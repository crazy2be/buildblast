package main

import (
	"flag"
	"log"
	"net/http"
	"os"
	"runtime"
	"runtime/pprof"
	"time"

	"code.google.com/p/go.net/websocket"

	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/persist"
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
	// 	setupPrompt()
	host := flag.String("host", ":8080", "Sets the host the server listens on for both http requests and websocket connections. Ex: \":8080\", \"localhost\", \"foobar.com\"")
	clientAssets := flag.String("client", ".", "Sets the location of the client assets that will be served")
	worldBaseDir := flag.String("world", "world/", "Sets the base folder used to store the world data.")
	persistEnabled := flag.Bool("persist", true, "Turn on experimental persist support? May cause lag or poor server performance.")
	flag.Parse()

	runtime.GOMAXPROCS(runtime.NumCPU())

	// Set up the world
	var world *game.World
	generator := mapgen.NewFlatWorld(float64(time.Now().Unix()))
	if *persistEnabled {
		log.Println("Running with persist ENABLED. Loading world from", *worldBaseDir)
		persister := persist.New(*worldBaseDir, generator)
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

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		handler(w, r, *clientAssets)
	})
	http.Handle("/sockets/main/", websocket.Handler(mainSocketHandler))
	http.Handle("/sockets/chunk/", websocket.Handler(chunkSocketHandler))

	err := http.ListenAndServe(*host, nil)
	if err != nil {
		log.Fatal("ListenAndServe:", err)
	}
}
