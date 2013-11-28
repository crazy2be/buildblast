package game

import (
	"log"
	"math/rand"
	"math"
	"strconv"

	"buildblast/lib/coords"
    "buildblast/lib/geom"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
	"buildblast/lib/observ"
	"buildblast/lib/observT"
)

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type World struct {
    observ.DisposeExposedImpl

	seed           float64
	chunks         map[coords.Chunk]mapgen.Chunk
	spawns         []coords.World
	chunkGenerator *ChunkGenerator

	blockListeners  []BlockListener
	
	EntitiesObserv	*ObservMap_string_Entity
	Teams			*ObservMap_string_Team
	MaxPoints		*observT.Observ_int

    //Currently the gamemode is always KOTH (king of the hill), and KOTH is hardcoded into
    //  the code. In the future it should be separated (once we write a few modes and find
    //  a good boundary to create a separate of concerns).

    //Observ, so we can move it, and so it can be more than just a value
    HillSphere      *geom.Observ_Sphere
	HillColor		*observT.Observ_string
	
	announce 		func (message string)
}

func NewWorld(seed float64, announce func (message string)) *World {
    observ.PrintLeaks()
	w := new(World)
	
	w.announce = announce
	
    w.WatchLeaks("World")
	w.seed = seed
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	generator := mapgen.NewMazeArena(seed)
	w.chunkGenerator = NewChunkGenerator(generator)
	go w.chunkGenerator.Run()

    //TODO: My use of these is probably not thread safe... should probably be
    //  (maybe the threading logic could go right in the observ? but probably not...)
	w.EntitiesObserv = NewObservMap_string_Entity(w)
	w.Teams = NewObservMap_string_Team(w)
	
	w.Teams.OnAdd(w, w.TeamAdded)
	
	w.MaxPoints = observT.NewObserv_int(w, 60 * 35)
	
    w.HillSphere = geom.NewObserv_Sphere(w, geom.Sphere{
        Center: coords.World{
			X: 0,
			Y: 21,
			Z: 0,
		},
        Radius: 20,
    })
	w.HillColor = observT.NewObserv_string(w, "white")

    w.EntitiesObserv.OnAdd(w, func (entityID string, entity Entity) {
        entity.Status().OnChanged(w, func (status Status) {
            if status.StatusFlag == Status_Dead {
                entity.Respawn(w.FindSpawn())
                entity.Status().Set(Status{
                    StatusFlag:     Status_Alive,
                    StatusSetter:   "World",
                })
            }
        })

        entity.HealthObserv().OnChanged(w, func (health Health) {
            if health.Points <= 0 {
                entity.Status().Set(Status{
                    StatusFlag:     Status_Dead,
                    StatusSetter:   health.Setter,
                })
            }
        })

        entity.Respawn(w.FindSpawn())
    })

	w.Teams.Set("Red", Team {
		Name: "Red",
		Color: "red",
		Points: 0,
	})
	
	w.Teams.Set("Blue", Team {
		Name: "Blue",
		Color: "blue",
		Points: 0,
	})
	
	w.Teams.Set("Yellow", Team {
		Name: "Yellow",
		Color: "yellow",
		Points: 0,
	})
	
	for i := 0; i < 0; i++ {
		name := "AI " + strconv.Itoa(i)
		w.EntitiesObserv.Set(name, NewAi(w, name))
	}

	return w
}

func (w *World) TeamAdded(key string, team Team) {
	if team.Points < w.MaxPoints.Get() { return }
	
	w.announce(team.Name + " has won, game is restarting NOW")
	
	//Move hill
	sphere := w.HillSphere.Get()
	sphere.Center = w.FindSpawn()
	w.HillSphere.Set(sphere)
	
	for _, team := range w.Teams.GetValues() {
		team.Points = 0
		w.Teams.Set(team.Name, team)
	}
	
    for _, entity := range w.EntitiesObserv.GetValues() {
        entity.Respawn(w.FindSpawn())
    }
}

func (w *World) Tick() {
	w.generationTick()
	
	entitiesInHill := make([]Entity, 0)
	
	for _, entity := range w.EntitiesObserv.GetValues() {
        e := entity.(Entity)
		e.Tick(w)
		w.chunkGenerator.QueueChunksNearby(e.Pos())
		
	    //TODO: Add proper sub, add, function on coords
	    hillSphere := w.HillSphere.Get()
	    hillDelta := &coords.Direction{
	        hillSphere.Center.X - e.Pos().X,
	        hillSphere.Center.Y - e.Pos().Y,
	        hillSphere.Center.Z - e.Pos().Z,
	    }
	    hillDistance := hillDelta.Length()
	    if hillDistance < hillSphere.Radius {
			entitiesInHill = append(entitiesInHill, e)
	    }
	}
	
	aTeamOnHill := ""
	teamsOnHill := make(map[string]int, 0)
	
	for _, e := range entitiesInHill {
		teamName := e.TeamName().Get()
		_, exists := teamsOnHill[teamName]
		if !exists {
			teamsOnHill[teamName] = 0
		}
		teamsOnHill[teamName]++
		aTeamOnHill = teamName
	}
	
	if len(teamsOnHill) > 1 {
		//Stale mate
		w.HillColor.Set("black")
	} else if len(teamsOnHill) == 1 {
		teamOnHill := w.Teams.Get(aTeamOnHill)
		w.HillColor.Set(teamOnHill.Color)
		
		//TODO: give points based on your long the tick was
		teamOnHill.Points += teamsOnHill[aTeamOnHill]
		
		//We cap the sum of all points in the game to MaxPoints
		MaxPoints := w.MaxPoints.Get()
		
		fncSumTeamStuff := func(fncSelect func(team Team) int) int {
			curCount := 0
			for _, team := range w.Teams.GetValues() {
				if team.Points <= 0 { continue }
				
				curCount += fncSelect(team)
			}
			return curCount
		}
		
		teamsWithPoints := fncSumTeamStuff(func(team Team) int{
			return 1;
		})
		
		sumPoints := fncSumTeamStuff(func(team Team) int{
			return team.Points
		})
		
		if sumPoints < MaxPoints || teamsWithPoints <= 1 { 
			w.Teams.Set(aTeamOnHill, teamOnHill)
			return 
		}
		
		//Too many points in the world, time to take some (from other people)
		newTeamPoints := make(map[string]int, 0)
		fncSumTeamStuff(func(team Team) int{
			if team.Name == teamOnHill.Name { return 0 }
			newTeamPoints[team.Name] = team.Points
			return 1
		})
		
		for teamsWithPoints > 1 && sumPoints >= MaxPoints {
			takePerTeam := int(math.Ceil(
				float64(sumPoints - MaxPoints) / 
				float64(teamsWithPoints - 1)))

			fncSumTeamStuff(func(team Team) int{
				if team.Name == teamOnHill.Name { return 0 }
				newTeamPoints[team.Name] -= takePerTeam
				if newTeamPoints[team.Name] < 0 {
					newTeamPoints[team.Name] = 0
				}
				return 1
			})
			
			sumPoints = fncSumTeamStuff(func(team Team) int {
				return newTeamPoints[team.Name]
			})
			teamsWithPoints = fncSumTeamStuff(func(team Team) int {
				if newTeamPoints[team.Name] <= 0 { return 0 }
				return 1
			})
		}
		
		for teamName, points := range newTeamPoints {
			otherTeam := w.Teams.Get(teamName)
			otherTeam.Points = points
			w.Teams.Set(teamName, otherTeam)
		}
		
		w.Teams.Set(aTeamOnHill, teamOnHill)
	} else {
		w.HillColor.Set("white")
	}
}

func (w *World) NextTeamName() string {
	//Maybe should base it on score?
	teamCounts := make(map[string]int, 0)
	for _, team := range w.Teams.GetValues() {
		teamCounts[team.Name] = 0
	}
	for _, entity := range w.EntitiesObserv.GetValues() {
        e := entity.(Entity)
		teamName := e.TeamName().Get()
		_, exists := teamCounts[teamName]
		if !exists {
			teamCounts[teamName] = 0
		}
		teamCounts[teamName]++
	}
	
	smallestTeam := ""
	//Hmm...
	//http://stackoverflow.com/questions/6878590/the-maximum-value-for-an-int-type-in-go
	smallestCount := int(^uint(0) >> 1)
	
	for teamName, count := range teamCounts {
		if count >= smallestCount { continue }
		smallestTeam = teamName
		smallestCount = count
	}
	
	return smallestTeam
}

func (w *World) generationTick() {
	select {
	case generationResult := <-w.chunkGenerator.Generated:
		cc := generationResult.cc
		chunk := generationResult.chunk
		spawns := generationResult.spawns

		w.spawns = append(w.spawns, spawns...)
		w.chunks[cc] = chunk
	default:
	}
}

func (w *World) FindSpawn() coords.World {
	l := len(w.spawns)
	if l <= 0 || true {	
		return coords.World{
			X: rand.Float64() * 20 - 10,
			Y: 21,
			Z: rand.Float64() * 100,
		}
	}
	//QTODO: Stop hardcoding the spawn.
	index := rand.Intn(l) //Needed to prevent complaint about not using math/rand
	index = index + 1
	return w.spawns[rand.Intn(l)];
}

func (w *World) Chunk(cc coords.Chunk) mapgen.Chunk {
	return w.chunks[cc]
}

func (w *World) Block(bc coords.Block) mapgen.Block {
	chunk := w.chunks[bc.Chunk()]
	if chunk == nil {
		return mapgen.BLOCK_NIL
	}
	return chunk.Block(bc.Offset())
}

func (w *World) ChangeBlock(bc coords.Block, newBlock mapgen.Block) {
	chunk := w.Chunk(bc.Chunk())

	oc := bc.Offset()
	block := chunk.Block(oc)
	chunk.SetBlock(oc, newBlock)

	for _, listener := range w.blockListeners {
		listener.BlockChanged(bc, block, newBlock)
	}
}

func (w *World) AddBlockListener(listener BlockListener) {
	w.blockListeners = append(w.blockListeners, listener)
}

func (w *World) RemoveBlockListener(listener BlockListener) {
	for i, other := range w.blockListeners {
		if other == listener {
			w.blockListeners[i] = w.blockListeners[len(w.blockListeners)-1]
			w.blockListeners = w.blockListeners[:len(w.blockListeners)-1]
			return
		}
	}
	log.Println("WARN: Attempt to remove block listener which does not exist.")
}

func (w *World) FindFirstIntersect(entity Entity, t float64, ray *physics.Ray) (*coords.World, Entity) {
    entities := w.EntitiesObserv.GetValues()

	boxes := make([]*physics.Box, len(entities))
	for i, other := range entities {
		if other == entity {
			boxes[i] = nil
		} else {
			boxes[i] = other.(Entity).BoxAt(t)
		}
	}

	hitPos, hitIndex := ray.FindAnyIntersect(w, boxes)
	if hitIndex != -1 {
		return hitPos, entities[hitIndex].(Entity)
	}
	return hitPos, nil
}
