package main

import (
	"math"
)

type Matrix [16]float32

func (m *Matrix) Identity() {
	m[0] = 1
	m[1] = 0
	m[2] = 0
	m[3] = 0
	m[4] = 0
	m[5] = 1
	m[6] = 0
	m[7] = 0
	m[8] = 0
	m[9] = 0
	m[10] = 1
	m[11] = 0
	m[12] = 0
	m[13] = 0
	m[14] = 0
	m[15] = 1
}

func (m *Matrix) Frustum(left, right, bottom, top, znear, zfar float32) {
	temp := 2.0 * znear
	temp2 := right - left
	temp3 := top - bottom
	temp4 := zfar - znear
	m[0] = temp / temp2
	m[1] = 0.0
	m[2] = 0.0
	m[3] = 0.0
	m[4] = 0.0
	m[5] = temp / temp3
	m[6] = 0.0
	m[7] = 0.0
	m[8] = (right + left) / temp2
	m[9] = (top + bottom) / temp3
	m[10] = (-zfar - znear) / temp4
	m[11] = -1.0
	m[12] = 0.0
	m[13] = 0.0
	m[14] = (-temp * zfar) / temp4
	m[15] = 0.0
}

func (m *Matrix) Perspective(fov, aspect, znear, zfar float32) {
	ymax := znear * float32(math.Tan(float64(fov*math.Pi/360.0)))
	xmax := ymax * aspect
	m.Frustum(-xmax, xmax, -ymax, ymax, znear, zfar)
}

func (m *Matrix) Quaternion(q0, q1, q2, q3 float32) {
	xx := q0 * q0 * 2
	yy := q1 * q1 * 2
	zz := q2 * q2 * 2
	xy := q0 * q1 * 2
	xz := q0 * q2 * 2
	yz := q1 * q2 * 2
	wx := q3 * q0 * 2
	wy := q3 * q1 * 2
	wz := q3 * q2 * 2

	m[0] = 1 - (yy + zz)
	m[4] = xy - wz
	m[8] = xz + wy

	m[1] = xy + wz
	m[5] = 1 - (xx + zz)
	m[9] = yz - wx

	m[2] = xz - wy
	m[6] = yz + wx
	m[10] = 1 - (xx + yy)

	// last column
	m[3] = 0
	m[7] = 0
	m[11] = 0

	// bottom row
	m[12] = 0
	m[13] = 0
	m[14] = 0
	m[15] = 1
}

func (m *Matrix) Translate(x, y, z float32) {
	m[3] += x;
	m[7] += y;
	m[11] += z;
}

func (m *Matrix) Multiply(a *Matrix, b *Matrix) {
	a11 := a[0]; a12 := a[4]; a13 := a[8]; a14 := a[12];
	a21 := a[1]; a22 := a[5]; a23 := a[9]; a24 := a[13];
	a31 := a[2]; a32 := a[6]; a33 := a[10]; a34 := a[14];
	a41 := a[3]; a42 := a[7]; a43 := a[11]; a44 := a[15];

	b11 := b[0]; b12 := b[4]; b13 := b[8]; b14 := b[12];
	b21 := b[1]; b22 := b[5]; b23 := b[9]; b24 := b[13];
	b31 := b[2]; b32 := b[6]; b33 := b[10]; b34 := b[14];
	b41 := b[3]; b42 := b[7]; b43 := b[11]; b44 := b[15];

	m[0] = a11 * b11 + a12 * b21 + a13 * b31 + a14 * b41;
	m[4] = a11 * b12 + a12 * b22 + a13 * b32 + a14 * b42;
	m[8] = a11 * b13 + a12 * b23 + a13 * b33 + a14 * b43;
	m[12] = a11 * b14 + a12 * b24 + a13 * b34 + a14 * b44;

	m[1] = a21 * b11 + a22 * b21 + a23 * b31 + a24 * b41;
	m[5] = a21 * b12 + a22 * b22 + a23 * b32 + a24 * b42;
	m[9] = a21 * b13 + a22 * b23 + a23 * b33 + a24 * b43;
	m[13] = a21 * b14 + a22 * b24 + a23 * b34 + a24 * b44;

	m[2] = a31 * b11 + a32 * b21 + a33 * b31 + a34 * b41;
	m[6] = a31 * b12 + a32 * b22 + a33 * b32 + a34 * b42;
	m[10] = a31 * b13 + a32 * b23 + a33 * b33 + a34 * b43;
	m[14] = a31 * b14 + a32 * b24 + a33 * b34 + a34 * b44;

	m[3] = a41 * b11 + a42 * b21 + a43 * b31 + a44 * b41;
	m[7] = a41 * b12 + a42 * b22 + a43 * b32 + a44 * b42;
	m[11] = a41 * b13 + a42 * b23 + a43 * b33 + a44 * b43;
	m[15] = a41 * b14 + a42 * b24 + a43 * b34 + a44 * b44;
}

func (m *Matrix) RotateX(angle float64) {
	s := float32(math.Sin(angle))
	c := float32(math.Cos(angle))
	a10 := m[4]
	a11 := m[5]
	a12 := m[6]
	a13 := m[7]
	a20 := m[8]
	a21 := m[9]
	a22 := m[10]
	a23 := m[11]

	// Perform axis-specific matrix multiplication
	m[4] = a10 * c + a20 * s;
	m[5] = a11 * c + a21 * s;
	m[6] = a12 * c + a22 * s;
	m[7] = a13 * c + a23 * s;

	m[8] = a10 * -s + a20 * c;
	m[9] = a11 * -s + a21 * c;
	m[10] = a12 * -s + a22 * c;
	m[11] = a13 * -s + a23 * c;
}

func (m *Matrix) RotateY(angle float64) {
	s := float32(math.Sin(angle))
	c := float32(math.Cos(angle))
	a00 := m[0]
	a01 := m[1]
	a02 := m[2]
	a03 := m[3]
	a20 := m[8]
	a21 := m[9]
	a22 := m[10]
	a23 := m[11]

	m[0] = a00 * c + a20 * -s
	m[1] = a01 * c + a21 * -s
	m[2] = a02 * c + a22 * -s
	m[3] = a03 * c + a23 * -s

	m[8]  = a00 * s + a20 * c
	m[9]  = a01 * s + a21 * c
	m[10] = a02 * s + a22 * c
	m[11] = a03 * s + a23 * c
}

func (m *Matrix) RotateZ(angle float64) {
    s := float32(math.Sin(angle))
	c := float32(math.Cos(angle))
	a00 := m[0]
	a01 := m[1]
	a02 := m[2]
	a03 := m[3]
	a10 := m[4]
	a11 := m[5]
	a12 := m[6]
	a13 := m[7]

	// Perform axis-specific matrix multiplication
	m[0] = a00 * c + a10 * s
	m[1] = a01 * c + a11 * s
	m[2] = a02 * c + a12 * s
	m[3] = a03 * c + a13 * s

	m[4] = a00 * -s + a10 * c
	m[5] = a01 * -s + a11 * c
	m[6] = a02 * -s + a12 * c
	m[7] = a03 * -s + a13 * c
}
