package game

import (
	"log"
	"math/rand"

	"buildblast/lib/coords"
	"buildblast/lib/mapgen"
	"buildblast/lib/physics"
)

type World struct {
	seed           float64
	chunks         map[coords.Chunk]*mapgen.Chunk
	spawns         []coords.World
	chunkGenerator *ChunkGenerator

	sprites []Sprite

	blockListeners  genericListenerContainer
	chunkListeners  genericListenerContainer
	spriteListeners genericListenerContainer
}

func NewWorld(generator mapgen.Generator) *World {
	w := new(World)
	w.chunks = make(map[coords.Chunk]*mapgen.Chunk)
	w.spawns = make([]coords.World, 0)

	w.chunkGenerator = NewChunkGenerator(generator)
	// Load the initial chunks
	w.chunkGenerator.QueueChunksNearby(coords.Origin)
	go w.chunkGenerator.Run()

	w.sprites = make([]Sprite, 0)

	w.blockListeners = makeGenericListenerContainer()
	w.chunkListeners = makeGenericListenerContainer()
	w.spriteListeners = makeGenericListenerContainer()
	return w
}

func (w *World) Tick() {
	w.generationTick()
	for _, s := range w.sprites {
		s.Tick(w)
		w.chunkGenerator.QueueChunksNearby(s.Wpos())
	}
}

func (w *World) generationTick() {
	for i := 0; i < 10; i++ {
		select {
		case generationResult := <-w.chunkGenerator.Generated:
			log.Println("Generated chunk! ", generationResult)
			cc := generationResult.cc
			chunk := generationResult.chunk

			chunk.Each(func(oc coords.Offset, block mapgen.Block) {
				if block == mapgen.BLOCK_SPAWN {
					w.spawns = append(w.spawns, oc.Block(cc).Center())
				}
			})

			w.chunks[cc] = chunk

			w.chunkListeners.FireEvent("ChunkGenerated", cc, chunk)
		default:
			return
		}
	}
}

func (w *World) findSpawn() coords.World {
	l := len(w.spawns)
	if l <= 0 {
		return coords.World{
			X: 0,
			Y: 21,
			Z: 0,
		}
	}
	return w.spawns[rand.Intn(l)]
}

func (w *World) Chunk(cc coords.Chunk) *mapgen.Chunk {
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

	w.blockListeners.FireEvent("BlockChanged", bc, block, newBlock)
}

func (w *World) AddSprite(s Sprite) {
	w.sprites = append(w.sprites, s)
	s.Respawn(w.findSpawn())

	w.spriteListeners.FireEvent("SpriteCreated", s.EntityId(), s)
}

func (w *World) RemoveSprite(s Sprite) {
	for i, sprite := range w.sprites {
		if sprite == s {
			w.sprites[i] = w.sprites[len(w.sprites)-1]
			w.sprites = w.sprites[:len(w.sprites)-1]

			w.spriteListeners.FireEvent("SpriteRemoved", s.EntityId())
		}
	}
}

func (w *World) DamageSprite(damager string, amount int, s Sprite) {
	s.Damage(amount)
	if s.Dead() {
		s.Respawn(w.findSpawn())
		w.spriteListeners.FireEvent("SpriteDied", s.EntityId(), s, damager)
	} else {
		// Should we fire Damaged events if they
		// end up dying? I dunno. Currently we don't.
		w.spriteListeners.FireEvent("SpriteDamaged", s.EntityId(), s)
	}
}

func (w *World) Sprites() map[EntityId]Sprite {
	result := make(map[EntityId]Sprite, len(w.sprites))
	for _, sprite := range w.sprites {
		result[sprite.EntityId()] = sprite
	}
	return result
}

func (w *World) FindFirstIntersect(entity Sprite, t float64, ray *physics.Ray) (*coords.World, Sprite) {
	boxes := make([]*physics.Box, len(w.sprites))
	for i, other := range w.sprites {
		if other == entity {
			boxes[i] = nil
		} else {
			boxes[i] = other.BoxAt(t)
		}
	}

	hitPos, hitIndex := ray.FindAnyIntersect(w, boxes)
	hitPosWorld := (*coords.World)(hitPos)
	if hitIndex != -1 {
		return hitPosWorld, w.sprites[hitIndex]
	}
	return hitPosWorld, nil
}
