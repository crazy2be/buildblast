package persist

import (
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/coords"
)

type WorldPersister struct {
	basePath string
	errorChan chan error
	generationWrapper *generationWrapper
}

type generationWrapper struct {
	fallbackGenerator mapgen.Generator
}

func New(basePath string, generator mapgen.Generator) *WorldPersister {
	wp := new(WorldPersister)
	wp.basePath = basePath
	wp.errorChan = make(chan error, 10)
	wp.generationWrapper = new(generationWrapper)
	wp.generationWrapper.fallbackGenerator = generator
	return wp
}

func (wp *WorldPersister) NextError() error {
	return <-wp.errorChan
}

func (wp *WorldPersister) ListenForChanges(w *game.World) {
	w.AddChunkListener(wp)
	w.AddBlockListener(wp)
}

func (wp *WorldPersister) ChunkGenerated(cc coords.Chunk, data mapgen.Chunk, spawns []coords.World) {

}

func (wp *WorldPersister) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {

}

func (wp *WorldPersister) MapGenerator() mapgen.Generator {
	return wp.generationWrapper
}

func (gw *generationWrapper) Chunk(cc coords.Chunk) (mapgen.Chunk, []coords.World) {
	return gw.fallbackGenerator.Chunk(cc)
}
