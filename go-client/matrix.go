package main

import (
	"math"
)

type Matrix [16]float32

func (m *Matrix) Identity() {
	m[0] = 1;
    m[1] = 0;
    m[2] = 0;
    m[3] = 0;
    m[4] = 0;
    m[5] = 1;
    m[6] = 0;
    m[7] = 0;
    m[8] = 0;
    m[9] = 0;
    m[10] = 1;
    m[11] = 0;
    m[12] = 0;
    m[13] = 0;
    m[14] = 0;
    m[15] = 1;
}

func (m *Matrix) Frustum(left, right, bottom, top, znear, zfar float32) {
    temp := 2.0 * znear;
    temp2 := right - left;
    temp3 := top - bottom;
    temp4 := zfar - znear;
    m[0] = temp / temp2;
    m[1] = 0.0;
    m[2] = 0.0;
    m[3] = 0.0;
    m[4] = 0.0;
    m[5] = temp / temp3;
    m[6] = 0.0;
    m[7] = 0.0;
    m[8] = (right + left) / temp2;
    m[9] = (top + bottom) / temp3;
    m[10] = (-zfar - znear) / temp4;
    m[11] = -1.0;
    m[12] = 0.0;
    m[13] = 0.0;
    m[14] = (-temp * zfar) / temp4;
    m[15] = 0.0;
}

func (m *Matrix) Perspective(fov, aspect, znear, zfar float32) {
    ymax := znear * float32(math.Tan(float64(fov * math.Pi / 360.0)))
    xmax := ymax * aspect
    m.Frustum(-xmax, xmax, -ymax, ymax, znear, zfar)
}
