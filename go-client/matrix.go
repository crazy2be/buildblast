package main

import (
	"math"
)

type Matrix [16]float32

var Identity = Matrix{
	1, 0, 0, 0,
	0, 1, 0, 0,
	0, 0, 1, 0,
	0, 0, 0, 1,
}

func MakeFrustum(left, right, bottom, top, znear, zfar float32) Matrix {
	temp := 2.0 * znear
	temp2 := right - left
	temp3 := top - bottom
	temp4 := zfar - znear
	return Matrix{
		temp / temp2,
		0.0,
		0.0,
		0.0,

		0.0,
		temp / temp3,
		0.0,
		0.0,

		(right + left) / temp2,
		(top + bottom) / temp3,
		(-zfar - znear) / temp4,
		-1.0,

		0.0,
		0.0,
		(-temp * zfar) / temp4,
		0.0,
	}
}

// fov in degrees
func MakePerspective(fov, aspect, znear, zfar float32) Matrix {
	ymax := znear * float32(math.Tan(float64(fov * math.Pi / 360.0)))
	xmax := ymax * aspect
	return MakeFrustum(-xmax, xmax, -ymax, ymax, znear, zfar)
}
