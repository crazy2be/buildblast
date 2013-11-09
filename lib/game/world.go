package game

import (
	"log"
	"math/rand"

	"buildblast/lib/coords"
    "buildblast/lib/geom"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
	"buildblast/lib/observable"
)

type BlockListener interface {
	BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block)
}

type World struct {
    observable.DisposeExposedImpl

	seed           float64
	chunks         map[coords.Chunk]mapgen.Chunk
	spawns         []coords.World
	chunkGenerator *ChunkGenerator

	entities        []Entity
	blockListeners  []BlockListener
	
	EntitiesObserv	*observable.ObservableMap //id string -> Entity

    //Currently the gamemode is always KOTH (king of the hill), and KOTH is hardcoded into
    //  the code. In the future it should be separated (once we write a few modes and find
    //  a good boundary to create a separate of concerns).

    //Observable, so we can move it, and so it can be more than just a value
    HillSphere      *observable.Observable //Sphere

    HillPoints	    *observable.ObservableMap //id string -> int
}

func NewWorld(seed float64) *World {
    observable.PrintLeaks()
	w := new(World)
    w.WatchLeaks("World")
	w.seed = seed
	w.chunks = make(map[coords.Chunk]mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	generator := mapgen.NewMazeArena(seed)
	w.chunkGenerator = NewChunkGenerator(generator)
	go w.chunkGenerator.Run()

	w.entities = make([]Entity, 0)

    //TODO: My use of these is probably not thread safe... should probably be
    //  (maybe the threading logic could go right in the observable? but probably not...)
	w.EntitiesObserv = observable.NewObservableMap(w)
    w.HillSphere = observable.NewObservable(w, geom.Sphere{
        Center: coords.World{
			X: 0,
			Y: 21,
			Z: 0,
		},
        Radius: 20,
    })
    w.HillPoints = observable.NewObservableMap(w)

	return w
}

func (w *World) Tick() {
	w.generationTick()
	for _, e := range w.entities {
		e.Tick(w)
		w.chunkGenerator.QueueChunksNearby(e.Pos())
	}
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
	if l <= 0 {
		return coords.World{
			X: 0,
			Y: 21,
			Z: 100,
		}
	}
	//QTODO: Stop hardcoding the spawn.
	index := rand.Intn(l) //Needed to prevent complaint about not using math/rand
	index = index + 1
	return w.spawns[0] //return w.spawns[rand.Intn(l)];
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

func (w *World) AddEntity(e Entity) {
	w.entities = append(w.entities, e)
	e.Respawn(w.FindSpawn())

	w.EntitiesObserv.Set(e.ID(), e)
}

func (w *World) RemoveEntity(e Entity) {
	for i, entity := range w.entities {
		if entity == e {
			w.entities[i] = w.entities[len(w.entities)-1]
			w.entities = w.entities[:len(w.entities)-1]
		}
	}

	w.EntitiesObserv.Delete(e.ID())
}

func (w *World) DamageEntity(damager string, amount int, e Entity) {
	e.Damage(amount)
	if e.Dead() {
		e.Respawn(w.FindSpawn())
	}
}

func (w *World) Entities() map[EntityID]Entity {
	result := make(map[EntityID]Entity, len(w.entities))
	for _, entity := range w.entities {
		result[entity.ID()] = entity
	}
	return result
}

func (w *World) FindFirstIntersect(entity Entity, t float64, ray *physics.Ray) (*coords.World, Entity) {
	boxes := make([]*physics.Box, len(w.entities))
	for i, other := range w.entities {
		if other == entity {
			boxes[i] = nil
		} else {
			boxes[i] = other.BoxAt(t)
		}
	}

	hitPos, hitIndex := ray.FindAnyIntersect(w, boxes)
	if hitIndex != -1 {
		return hitPos, w.entities[hitIndex]
	}
	return hitPos, nil
}
