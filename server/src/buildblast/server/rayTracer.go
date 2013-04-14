package main

import (
	"math"
	"sort"

	"buildblast/coords"
	"buildblast/mapgen"
)

type Ray struct {
	pos    coords.World
	dir    coords.Vec3
	idir   coords.Vec3  // Inversed direction
}

func (ray *Ray) dist(to coords.World) float64 {
	return math.Sqrt(
		math.Pow(ray.pos.X - to.X, 2) +
		math.Pow(ray.pos.Y - to.Y, 2) +
		math.Pow(ray.pos.Z - to.Z, 2))
}

type ChunkHit struct {
	pos   coords.Chunk
	dist  float64
}

type BlockHit struct {
	pos  *coords.World
	dist float64
}

// ChunkHit sorting interface
type ChunkHits []*ChunkHit

func (ch ChunkHits) Len() int { return len(ch) }
func (ch ChunkHits) Swap(i, j int) { ch[i], ch[j] = ch[j], ch[i] }

type ByDist struct { ChunkHits }

func (s ByDist) Less(i, j int) bool { return s.ChunkHits[i].dist < s.ChunkHits[j].dist }

func FindIntersection(world *World, player *Player, controls *ControlState) *coords.World {
	rayPosition := player.pos
	rayPosition.Y += PLAYER_EYE_HEIGHT

	cos := math.Cos
	sin := math.Sin

	lat := controls.Lat
	lon := controls.Lon
	rayDir := coords.Vec3{
		X: sin(lat) * cos(lon),
		Y: cos(lat),
		Z: sin(lat) * sin(lon),
	}
	iRayDir := coords.Vec3{
		X: 1 / rayDir.X,
		Y: 1 / rayDir.Y,
		Z: 1 / rayDir.Z,
	}
	ray := &Ray{
		pos: rayPosition,
		dir: rayDir,
		idir: iRayDir,
	}

	// Don't change the world while looking through it.
	// Perhaps this should make a copy, as this very well could block all chunk
	// modifications with enough players
	world.chunkLock.Lock()
	defer world.chunkLock.Unlock()

	// find our intersection
	return trace(ray, world.chunks)
}

func trace(ray *Ray, chunks map[coords.Chunk]mapgen.Chunk) *coords.World {
	// Find which chunks we intersect
	var chunkHits []*ChunkHit
	for k, _ := range chunks {
		val := intersect(k.World(), coords.CHUNK_WIDTH, ray)
		if val != nil {
			hit := &ChunkHit{
				pos: k,
				dist: ray.dist(k.World()),
			}
			chunkHits = append(chunkHits, hit)
		}
	}
	if len(chunkHits) == 0 {
		return nil
	}
	sort.Sort(ByDist{chunkHits})

	// Go through the chunks we hit and find the block
	for _, v := range chunkHits {
		var firstBlock *BlockHit
		chunk := chunks[v.pos]
		for x, a := range chunk {
			for y, b := range a {
				for z, block := range b {
					if block.Solid() {
						worldPos := coords.World {
							X: float64(v.pos.X + x),
							Y: float64(v.pos.Y + y),
							Z: float64(v.pos.Z + z),
						}
						val := intersect(worldPos, 1, ray)
						if val != nil {
							dist := ray.dist(*val)
							if firstBlock == nil {
								firstBlock = &BlockHit{
									pos: val,
									dist: dist,
								}
							} else {
								if dist < firstBlock.dist {
									firstBlock.pos = val
									firstBlock.dist = dist
								}
							}
						}
					}
				}
			}
		}
		if firstBlock != nil {
			return firstBlock.pos
		}
	}
	return nil
}

// Assumes squares, chunks must be squares, blocks must be squares
func intersect(pos coords.World, size float64, ray *Ray) *coords.World {
	min := math.Min
	max := math.Max

	tx1 := (pos.X        - ray.pos.X) * ray.idir.X
	tx2 := (pos.X + size - ray.pos.X) * ray.idir.X
	xmin := min(tx1, tx2)
	xmax := max(tx1, tx2)

	ty1 := (pos.Y        - ray.pos.Y) * ray.idir.Y
	ty2 := (pos.Y + size - ray.pos.Y) * ray.idir.Y
	ymin := min(ty1, ty2)
	ymax := max(ty1, ty2)

	tz1 := (pos.Z        - ray.pos.Z) * ray.idir.Z
	tz2 := (pos.Z + size - ray.pos.Z) * ray.idir.Z
	zmin := min(tz1, tz2)
	zmax := max(tz1, tz2)

	tmin := max(max(xmin, ymin), zmin)
	tmax := min(min(xmax, ymax), zmax)

	if (tmax >= max(0, tmin)) && (tmin < math.Inf(1)) {
		return &coords.World{
			X: xmin,
			Y: ymin,
			Z: zmin,
		}
	}
	return nil
}


