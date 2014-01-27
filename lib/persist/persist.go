package persist

import (
	"os"
	"log"
	"strconv"
	"io/ioutil"

	"buildblast/lib/game"
	"buildblast/lib/mapgen"
	"buildblast/lib/coords"
)

type chunk struct {
	data mapgen.Chunk
	spawns []coords.World
}

type persister struct {
	basePath string
	errorChan chan error
	fallbackGenerator mapgen.Generator
	world *game.World
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

func (p *persister) ChunkGenerated(cc coords.Chunk, data mapgen.Chunk, spawns []coords.World) {
	err := p.saveChunk(cc, &chunk{data, spawns})
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
	chunk.data.SetBlock(bc.Offset(), new)
	err = p.saveChunk(cc, chunk)
	if err != nil {
		log.Println("Applying block change: ", err)
		return
	}
}

func (p *persister) MapGenerator() mapgen.Generator {
	return p
}

func (p *persister) Chunk(cc coords.Chunk) (mapgen.Chunk, []coords.World) {
	if chunk, err := p.loadChunk(cc); err == nil {
		return chunk.data, chunk.spawns
	} else {
		return p.fallbackGenerator.Chunk(cc)
	}
}

func (p *persister) loadChunk(cc coords.Chunk) (*chunk, error) {
	raw, err := ioutil.ReadFile(p.basePath + hash(cc) + ".chunk")
	if err != nil {
		log.Println("Persist: Error loading chunk: ", err)
		return nil, err
	}

	chunk, err := deserializeChunkData(raw)
	if err != nil {
		log.Println("Persist: Error loading chunk: ", err)
		return nil, err
	}
	return chunk, nil
}

func (p *persister) saveChunk(cc coords.Chunk, chunk *chunk) error {
	raw, err := serializeChunkData(chunk)
	if err != nil {
		log.Println("Persist: Error saving chunk: ", err)
		return err
	}

	err = ioutil.WriteFile(p.basePath + hash(cc) + ".chunk", raw, 0644)
	if err != nil {
		log.Println("Persist: Error saving chunk: ", err)
		return err
	}
	return nil
}

func hash(cc coords.Chunk) string {
	return strconv.Itoa(cc.X) + "," + strconv.Itoa(cc.Y) + "," + strconv.Itoa(cc.Z)
}
