// http://mrl.nyu.edu/~perlin/noise/
package main

import (
)

type ChunkGenerator interface {
	Chunk(cc ChunkCoords) Chunk
}

type TunnelGenerator struct {

}

func NewTunnelGenerator() *TunnelGenerator {
	return new(TunnelGenerator)
}


