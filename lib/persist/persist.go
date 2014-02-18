package persist

import (
	"fmt"
	"io/ioutil"
	"log"
	"os"
	"path"

	"buildblast/lib/coords"
	"buildblast/lib/game"
	"buildblast/lib/mapgen"
)

type persister struct {
	basePath          string
	errorChan         chan error
	fallbackGenerator mapgen.Generator
	world             *game.World
}

func New(basePath string, generator mapgen.Generator) *persister {
	p := new(persister)
	p.basePath = basePath
	p.errorChan = make(chan error, 10)
	p.fallbackGenerator = generator
	err := os.MkdirAll(basePath, 0755)
	if err != nil {
		log.Println("Persist: ", err)
	}
	return p
}

func (p *persister) NextError() error {
	return <-p.errorChan
}

func (p *persister) ListenForChanges(w *game.World) {
	w.AddChunkListener(p)
	w.AddBlockListener(p)
}

func (p *persister) ChunkGenerated(cc coords.Chunk, chunk *mapgen.Chunk) {
	err := p.saveChunk(cc, chunk)
	if err != nil {
		log.Println("Saving chunk: ", err)
	}
}

func (p *persister) BlockChanged(bc coords.Block, old mapgen.Block, new mapgen.Block) {
	cc := bc.Chunk()
	chunk, err := p.loadChunk(cc)
	if err != nil {
		log.Println("Applying block change: ", err)
		return
	}
	chunk.SetBlock(bc.Offset(), new)
	err = p.saveChunk(cc, chunk)
	if err != nil {
		log.Println("Applying block change: ", err)
		return
	}
}

func (p *persister) MapGenerator() mapgen.Generator {
	return p
}

// WARNING: Runs on a different thread than everything else in
// this object! Be careful!
func (p *persister) Chunk(cc coords.Chunk) *mapgen.Chunk {
	if chunk, err := p.loadChunk(cc); err == nil {
		return chunk
	} else {
		return p.fallbackGenerator.Chunk(cc)
	}
}

func (p *persister) loadChunk(cc coords.Chunk) (*mapgen.Chunk, error) {
	raw, err := ioutil.ReadFile(p.filePath(cc))
	if err != nil {
		// File read errors happen all the time (i.e. when the
		// chunk has not been generated yet), so we don't bother
		// printing them.
		return nil, err
	}

	chunk, err := deserializeChunkData(raw)
	if err != nil {
		log.Println("Persist: Error loading chunk: ", err)
		return nil, err
	}
	return chunk, nil
}

func (p *persister) saveChunk(cc coords.Chunk, chunk *mapgen.Chunk) error {
	raw, err := serializeChunkData(chunk)
	if err != nil {
		log.Println("Persist: Error saving chunk: ", err)
		return err
	}

	err = ioutil.WriteFile(p.filePath(cc), raw, 0644)
	if err != nil {
		log.Println("Persist: Error saving chunk: ", err)
		return err
	}
	return nil
}

func (p *persister) filePath(cc coords.Chunk) string {
	fileName := fmt.Sprintf("%d,%d,%d.chunk", cc.X, cc.Y, cc.Z)
	return path.Join(p.basePath, fileName)
}
