package main

func make_cube(x, y, z, n float32) []float32 {
	return []float32{
		x - n, y - n, z + n,
		x + n, y - n, z + n,
		x + n, y + n, z + n,
		x - n, y + n, z + n,

		x - n, y - n, z - n,
		x - n, y + n, z - n,
		x + n, y + n, z - n,
		x + n, y - n, z - n,

		x - n, y + n, z - n,
		x - n, y + n, z + n,
		x + n, y + n, z + n,
		x + n, y + n, z - n,

		x - n, y - n, z - n,
		x + n, y - n, z - n,
		x + n, y - n, z + n,
		x - n, y - n, z + n,

		x + n, y - n, z - n,
		x + n, y + n, z - n,
		x + n, y + n, z + n,
		x + n, y - n, z + n,

		x - n, y - n, z - n,
		x - n, y - n, z + n,
		x - n, y + n, z + n,
		x - n, y + n, z - n,
	}
}
