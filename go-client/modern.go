package main

func make_cube(x, y, z, n float32) []float32 {
// 	cube := make([]float32, 6*4*3)
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
// 	i := 0
// 	i++
// 	output[i-1] = x - n
// 	i++
// 	output[i-1] = y - n
// 	i++
// 	output[i-1] = z - n
//
// 	i++
// 	output[i-1] = x - n
// 	i++
// 	output[i-1] = y - n
// 	i++
// 	output[i-1] = z + n
//
// 	i++
// 	output[i-1] = x - n
// 	i++
// 	output[i-1] = y + n
// 	i++
// 	output[i-1] = z - n
//
// 	i++
// 	output[i-1] = x - n
// 	i++
// 	output[i-1] = y + n
// 	i++
// 	output[i-1] = z + n
//
// 	i++
// 	output[i-1] = x + n
// 	i++
// 	output[i-1] = y - n
// 	i++
// 	output[i-1] = z - n
//
// 	i++
// 	output[i-1] = x + n
// 	i++
// 	output[i-1] = y - n
// 	i++
// 	output[i-1] = z + n
//
// 	i++
// 	output[i-1] = x + n
// 	i++
// 	output[i-1] = y + n
// 	i++
// 	output[i-1] = z - n
//
// 	i++
// 	output[i-1] = x + n
// 	i++
// 	output[i-1] = y + n
// 	i++
// 	output[i-1] = z + n
}
