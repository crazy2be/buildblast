package mapgen
//
// import (
// 	"buildblast/coords"
// )
//
// type Map struct {
// 	generator ChunkSource
// 	chunks map[coords.Chunk]mapgen.Chunk
// 	lock sync.Mutex
// }
//
// func (m *Map) Block(wc coords.World) Block {
// 	m.lock.Lock()
// 	defer m.lock.Unlock()
//
// 	cc := wc.Chunk()
// 	oc := wc.Offset()
// 	chunk := m.chunks[cc]
// 	if chunk == nil {
// 		return BLOCK_NIL
// 	}
// 	return chunk.Block(oc)
// }
//
// func (m *Map) RequestChunk(cc coords.Chunk) Chunk {
// 	m.lock.Lock()
// 	defer m.lock.Unlock()
//
// 	chunk := m.chunks[cc]
//
// }
