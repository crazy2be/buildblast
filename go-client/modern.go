package main

func make_cube(output []float32, x, y, z, n float32) {
	i := 0
	i++; output[i-1] =  x - n;
	i++; output[i-1] =  y - n;
	i++; output[i-1] =  z - n;
	i++; output[i-1] =  x - n;
	i++; output[i-1] =  y - n;
	i++; output[i-1] =  z + n;
	i++; output[i-1] =  x - n;
	i++; output[i-1] =  y + n;
	i++; output[i-1] =  z - n;
	i++; output[i-1] =  x - n;
	i++; output[i-1] =  y + n;
	i++; output[i-1] =  z + n;
	i++; output[i-1] =  x + n;
	i++; output[i-1] =  y - n;
	i++; output[i-1] =  z - n;
	i++; output[i-1] =  x + n;
	i++; output[i-1] =  y - n;
	i++; output[i-1] =  z + n;
	i++; output[i-1] =  x + n;
	i++; output[i-1] =  y + n;
	i++; output[i-1] =  z - n;
	i++; output[i-1] =  x + n;
	i++; output[i-1] =  y + n;
	i++; output[i-1] =  z + n;
}
