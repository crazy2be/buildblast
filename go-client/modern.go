package main

type Cube struct {

}

func make_cube(x, y, z, n float32) []float32 {
	return []float32{
		x - n, y - n, z + n,
		0, 0,
		x + n, y - n, z + n,
		1, 0,
		x + n, y + n, z + n,
		1, 1,
		x - n, y + n, z + n,
		0, 1,

		x - n, y - n, z - n,
		1, 0,
		x - n, y + n, z - n,
		1, 1,
		x + n, y + n, z - n,
		0, 1,
		x + n, y - n, z - n,
		0, 0,

		x - n, y + n, z - n,
		0, 1,
		x - n, y + n, z + n,
		0, 0,
		x + n, y + n, z + n,
		1, 0,
		x + n, y + n, z - n,
		1, 1,

		x - n, y - n, z - n,
		1, 1,
		x + n, y - n, z - n,
		0, 1,
		x + n, y - n, z + n,
		0, 0,
		x - n, y - n, z + n,
		1, 0,

		x + n, y - n, z - n,
		1, 0,
		x + n, y + n, z - n,
		1, 1,
		x + n, y + n, z + n,
		0, 1,
		x + n, y - n, z + n,
		0, 0,

		x - n, y - n, z - n,
		0, 0,
		x - n, y - n, z + n,
		1, 0,
		x - n, y + n, z + n,
		1, 1,
		x - n, y + n, z - n,
		0, 1,
	}
}
