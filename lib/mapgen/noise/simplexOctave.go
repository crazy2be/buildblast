package noise

import (
	"math"
	"math/rand"
)

// http://stackoverflow.com/questions/18279456/any-simplex-noise-tutorials-or-resources

// Struct to speed up gradient computations
// (array access is a lot slower than member access)
type Grad struct {
	x, y, z, w float64
}

func NewGrad3(x, y, z float64) Grad {
	return Grad{
		x: x,
		y: y,
		z: z,
	}
}

func NewGrad4(x, y, z, w float64) Grad {
	r := NewGrad3(x, y, z)
	r.w = w
	return r
}

// All numbers, [0, 255] in random order, based on seed
var PERLIN_BASE = []int{
	151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 233, 7, 225, 140, 36, 103, 30, 69,
	142, 8, 99, 37, 240, 21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 94, 252, 219,
	203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175,
	74, 165, 71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 122, 60, 211, 133, 230,
	220, 105, 92, 41, 55, 46, 245, 40, 244, 102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76,
	132, 187, 208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 109, 198, 173, 186,
	3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 147, 118, 126, 255, 82, 85, 212, 207, 206, 59,
	227, 47, 16, 58, 17, 182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 70,
	221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 108, 110, 79, 113, 224, 232, 178,
	185, 112, 104, 218, 246, 97, 228, 251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81,
	51, 145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 184, 84, 204, 176, 115,
	121, 50, 45, 127, 4, 150, 254, 138, 236, 205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195,
	78, 66, 215, 61, 156, 180,
}

var SWAP_ITERATIONS = 256 * 4

var GRAD3 = []Grad{
	NewGrad3(1, 1, 0), NewGrad3(-1, 1, 0), NewGrad3(1, -1, 0), NewGrad3(-1, -1, 0),
	NewGrad3(1, 0, 1), NewGrad3(-1, 0, 1), NewGrad3(1, 0, -1), NewGrad3(-1, 0, -1),
	NewGrad3(0, 1, 1), NewGrad3(0, -1, 1), NewGrad3(0, 1, -1), NewGrad3(0, -1, -1),
}

var GRAD4 = []Grad{
	NewGrad4(0, 1, 1, 1), NewGrad4(0, 1, 1, -1), NewGrad4(0, 1, -1, 1), NewGrad4(0, 1, -1, -1),
	NewGrad4(0, -1, 1, 1), NewGrad4(0, -1, 1, -1), NewGrad4(0, -1, -1, 1), NewGrad4(0, -1, -1, -1),
	NewGrad4(1, 0, 1, 1), NewGrad4(1, 0, 1, -1), NewGrad4(1, 0, -1, 1), NewGrad4(1, 0, -1, -1),
	NewGrad4(-1, 0, 1, 1), NewGrad4(-1, 0, 1, -1), NewGrad4(-1, 0, -1, 1), NewGrad4(-1, 0, -1, -1),
	NewGrad4(1, 1, 0, 1), NewGrad4(1, 1, 0, -1), NewGrad4(1, -1, 0, 1), NewGrad4(1, -1, 0, -1),
	NewGrad4(-1, 1, 0, 1), NewGrad4(-1, 1, 0, -1), NewGrad4(-1, -1, 0, 1), NewGrad4(-1, -1, 0, -1),
	NewGrad4(1, 1, 1, 0), NewGrad4(1, 1, -1, 0), NewGrad4(1, -1, 1, 0), NewGrad4(1, -1, -1, 0),
	NewGrad4(-1, 1, 1, 0), NewGrad4(-1, 1, -1, 0), NewGrad4(-1, -1, 1, 0), NewGrad4(-1, -1, -1, 0),
}

// Skewing and unskewing factors for 2, 3, and 4 dimensions
var F2 = 0.5 * (math.Sqrt(3.0) - 1.0)
var G2 = (3.0 - math.Sqrt(3.0)) / 6.0
var F3 = 1.0 / 3.0
var G3 = 1.0 / 6.0
var F4 = (math.Sqrt(5.0) - 1.0) / 4.0
var G4 = (5.0 - math.Sqrt(5.0)) / 20.0

func dot2(g Grad, x, y float64) float64 {
	return g.x*x + g.y*y
}

func dot3(g Grad, x, y, z float64) float64 {
	return g.x*x + g.y*y + g.z*z
}

func dot4(g Grad, x, y, z, w float64) float64 {
	return g.x*x + g.y*y + g.z*z + g.w*w
}

type SimplexOctave struct {
	perm      []int
	permMod12 []int
}

func NewSimplexOctave(seed int64) *SimplexOctave {
	so := new(SimplexOctave)
	// To remove the need for index wrapping, double the permutation table length
	so.perm = make([]int, 512)
	so.permMod12 = make([]int, 512)

	perlin := make([]int, 256)
	copy(perlin, PERLIN_BASE)

	randGen := rand.New(rand.NewSource(seed))
	for i := 0; i < SWAP_ITERATIONS; i++ {
		a := randGen.Intn(256)
		b := randGen.Intn(256)
		temp := perlin[a]
		perlin[a] = perlin[b]
		perlin[b] = temp
	}

	for i := 0; i < 512; i++ {
		so.perm[i] = perlin[i&255]
		so.permMod12[i] = so.perm[i] % 12
	}

	return so
}

func (so *SimplexOctave) noise2(x, y float64) float64 {
	// Noise contributions from the three corners
	var n0, n1, n2 float64

	// Skew the input space to determine which simplex cell we're in
	s := (x + y) * F2 // Hairy factor for 2D
	i := int(x + s)   // Fast floor
	j := int(y + s)

	// Unskew the cell origin back to (x,y) space
	t := float64(i+j) * G2
	X0 := float64(i) - t
	Y0 := float64(j) - t
	// The x,y distances from the cell origin
	x0 := x - X0
	y0 := y - Y0

	// For the 2D case, the simplex shape is an equilateral triangle.

	// Determine which simplex we are in.
	var i1, j1 int // Offsets for second (middle) corner of simplex in (i,j) coords
	if x0 > y0 {
		// lower triangle, XY order: (0, 0)->(1, 0)->(1, 1)
		i1 = 1
		j1 = 0
	} else {
		// upper triangle, YX order: (0, 0)->(0, 1)->(1, 1)
		i1 = 0
		j1 = 1
	}

	// A step of (1, 0) in (i,j) means a step of (1-c,-c) in (x,y), and
	// a step of (0, 1) in (i,j) means a step of (-c, 1-c) in (x,y), where
	// c = (3-sqrt(3))/6

	// Offsets for middle corner in (x,y) unskewed coords
	x1 := x0 - float64(i1) + G2
	y1 := y0 - float64(j1) + G2
	// Offsets for last corner in (x,y) unskewed coords
	x2 := x0 - 1.0 + 2.0*G2
	y2 := y0 - 1.0 + 2.0*G2

	// Work out the hashed gradient indices of the three simplex corners
	ii := i & 255
	jj := j & 255
	gi0 := so.permMod12[ii+so.perm[jj]]
	gi1 := so.permMod12[ii+i1+so.perm[jj+j1]]
	gi2 := so.permMod12[ii+1+so.perm[jj+1]]

	// Calculate the contribution from the three corners
	t0 := 0.5 - x0*x0 - y0*y0
	if t0 < 0 {
		n0 = 0.0
	} else {
		t0 *= t0
		n0 = t0 * t0 * dot2(GRAD3[gi0], x0, y0) // (x,y) of grad3 used for 2D gradient
	}
	t1 := 0.5 - x1*x1 - y1*y1
	if t1 < 0 {
		n1 = 0.0
	} else {
		t1 *= t1
		n1 = t1 * t1 * dot2(GRAD3[gi1], x1, y1)
	}
	t2 := 0.5 - x2*x2 - y2*y2
	if t2 < 0 {
		n2 = 0.0
	} else {
		t2 *= t2
		n2 = t2 * t2 * dot2(GRAD3[gi2], x2, y2)
	}

	// Add contributions from each corner to get the final noise value.
	// The result is scaled to return values in the interval [-1, 1].
	return 70.0 * (n0 + n1 + n2)
}

func (so *SimplexOctave) noise3(x, y, z float64) float64 {
	// Noise contributions from the four corners
	var n0, n1, n2, n3 float64

	// Skew the input space to determine which simplex cell we're in
	s := (x + y + z) * F3 // Very nice and simple skew factor for 3D
	i := int(x + s)
	j := int(y + s)
	k := int(z + s)

	// Unskew the cell origin back to (x,y,z) space
	t := float64(i+j+k) * G3
	X0 := float64(i) - t
	Y0 := float64(j) - t
	Z0 := float64(k) - t
	// The x,y,z distances from the cell origin
	x0 := x - X0
	y0 := y - Y0
	z0 := z - Z0

	// For the 3D case, the simplex shape is a slightly irregular tetrahedron.

	// Determine which simplex we are in.
	var i1, j1, k1 int // Offsets for second corner of simplex in (i,j,k) coords
	var i2, j2, k2 int // Offsets for third corner of simplex in (i,j,k) coords
	if x0 >= y0 {
		if y0 >= z0 {
			// X Y Z order
			i1 = 1
			j1 = 0
			k1 = 0
			i2 = 1
			j2 = 1
			k2 = 0
		} else if x0 >= z0 {
			// X Z Y order
			i1 = 1
			j1 = 0
			k1 = 0
			i2 = 1
			j2 = 0
			k2 = 1
		} else {
			// Z X Y order
			i1 = 0
			j1 = 0
			k1 = 1
			i2 = 1
			j2 = 0
			k2 = 1
		}
	} else { // x0 < y0
		if y0 < z0 {
			// Z Y X order
			i1 = 0
			j1 = 0
			k1 = 1
			i2 = 0
			j2 = 1
			k2 = 1
		} else if x0 < z0 {
			// Y Z X order
			i1 = 0
			j1 = 1
			k1 = 0
			i2 = 0
			j2 = 1
			k2 = 1
		} else {
			// Y X Z order
			i1 = 0
			j1 = 1
			k1 = 0
			i2 = 1
			j2 = 1
			k2 = 0
		}
	}

	// A step of (1, 0, 0) in (i,j,k) means a step of (1-c,-c,-c) in (x,y,z),
	// a step of (0, 1, 0) in (i,j,k) means a step of (-c, 1-c,-c) in (x,y,z), and
	// a step of (0, 0, 1) in (i,j,k) means a step of (-c,-c, 1-c) in (x,y,z), where
	// c = 1/6.

	// Offsets for second corner in (x,y,z) coords
	x1 := x0 - float64(i1) + G3
	y1 := y0 - float64(j1) + G3
	z1 := z0 - float64(k1) + G3
	// Offsets for third corner in (x,y,z) coords
	x2 := x0 - float64(i2) + 2.0*G3
	y2 := y0 - float64(j2) + 2.0*G3
	z2 := z0 - float64(k2) + 2.0*G3
	// Offsets for last corner in (x,y,z) coords
	x3 := x0 - 1.0 + 3.0*G3
	y3 := y0 - 1.0 + 3.0*G3
	z3 := z0 - 1.0 + 3.0*G3

	// Work out the hashed gradient indices of the four simplex corners
	ii := i & 255
	jj := j & 255
	kk := k & 255
	gi0 := so.permMod12[ii+so.perm[jj+so.perm[kk]]]
	gi1 := so.permMod12[ii+i1+so.perm[jj+j1+so.perm[kk+k1]]]
	gi2 := so.permMod12[ii+i2+so.perm[jj+j2+so.perm[kk+k2]]]
	gi3 := so.permMod12[ii+1+so.perm[jj+1+so.perm[kk+1]]]

	// Calculate the contribution from the four corners
	t0 := 0.6 - x0*x0 - y0*y0 - z0*z0
	if t0 < 0 {
		n0 = 0.0
	} else {
		t0 *= t0
		n0 = t0 * t0 * dot3(GRAD3[gi0], x0, y0, z0)
	}
	t1 := 0.6 - x1*x1 - y1*y1 - z1*z1
	if t1 < 0 {
		n1 = 0.0
	} else {
		t1 *= t1
		n1 = t1 * t1 * dot3(GRAD3[gi1], x1, y1, z1)
	}
	t2 := 0.6 - x2*x2 - y2*y2 - z2*z2
	if t2 < 0 {
		n2 = 0.0
	} else {
		t2 *= t2
		n2 = t2 * t2 * dot3(GRAD3[gi2], x2, y2, z2)
	}
	t3 := 0.6 - x3*x3 - y3*y3 - z3*z3
	if t3 < 0 {
		n3 = 0.0
	} else {
		t3 *= t3
		n3 = t3 * t3 * dot3(GRAD3[gi3], x3, y3, z3)
	}

	// Add contributions from each corner to get the final noise value.
	// The result is scaled to stay just inside [-1, 1]
	return 32.0 * (n0 + n1 + n2 + n3)
}

func (so *SimplexOctave) noise4(x, y, z, w float64) float64 {
	// Noise contributions from the five corners
	var n0, n1, n2, n3, n4 float64

	// Skew the (x,y,z,w) space to determine which cell of 24 simplices we're in
	s := (x + y + z + w) * F4 // Factor for 4D skewing
	i := int(x + s)
	j := int(y + s)
	k := int(z + s)
	l := int(w + s)
	t := float64(i+j+k+l) * G4 // Factor for 4D unskewing

	// Unskew the cell origin back to (x,y,z,w) space
	X0 := float64(i) - t
	Y0 := float64(j) - t
	Z0 := float64(k) - t
	W0 := float64(l) - t
	// The x,y,z,w distances from the cell origin
	x0 := x - X0
	y0 := y - Y0
	z0 := z - Z0
	w0 := w - W0

	// For the 4D case, the simplex is a 4D shape I won't even try to describe. (5-cell)
	// To find out which of the 24 possible simplices we're in, we need to
	// determine the magnitude ordering of x0, y0, z0 and w0.
	// Six pair-wise comparisons are performed between each possible pair
	// of the four coordinates, and the results are used to rank the numbers.
	rankx := 0
	ranky := 0
	rankz := 0
	rankw := 0
	if x0 > y0 {
		rankx++
	} else {
		ranky++
	}
	if x0 > z0 {
		rankx++
	} else {
		rankz++
	}
	if x0 > w0 {
		rankx++
	} else {
		rankw++
	}
	if y0 > z0 {
		ranky++
	} else {
		rankz++
	}
	if y0 > w0 {
		ranky++
	} else {
		rankw++
	}
	if z0 > w0 {
		rankz++
	} else {
		rankw++
	}

	var i1, j1, k1, l1 int // The integer offsets for the second simplex corner
	var i2, j2, k2, l2 int // The integer offsets for the third simplex corner
	var i3, j3, k3, l3 int // The integer offsets for the fourth simplex corner

	// simplex[c] is a 4-vector with the numbers 0, 1, 2 and 3 in some order.
	// Many values of c will never occur, since e.g. x>y>z>w makes x<z, y<w and x<w
	// impossible. Only the 24 indices which have non-zero entries make any sense.
	// We use a thresholding to set the coordinates in turn from the largest magnitude.
	// Rank 3 denotes the largest coordinate.
	if rankx >= 3 {
		i1 = 1
	} else {
		i1 = 0
	}
	if ranky >= 3 {
		j1 = 1
	} else {
		j1 = 0
	}
	if rankz >= 3 {
		k1 = 1
	} else {
		k1 = 0
	}
	if rankw >= 3 {
		l1 = 1
	} else {
		l1 = 0
	}
	// Rank 2 denotes the second largest coordinate.
	if rankx >= 2 {
		i2 = 1
	} else {
		i2 = 0
	}
	if ranky >= 2 {
		j2 = 1
	} else {
		j2 = 0
	}
	if rankz >= 2 {
		k2 = 1
	} else {
		k2 = 0
	}
	if rankw >= 2 {
		l2 = 1
	} else {
		l2 = 0
	}
	// Rank 1 denotes the second smallest coordinate.
	if rankx >= 1 {
		i3 = 1
	} else {
		i3 = 0
	}
	if ranky >= 1 {
		j3 = 1
	} else {
		j3 = 0
	}
	if rankz >= 1 {
		k3 = 1
	} else {
		k3 = 0
	}
	if rankw >= 1 {
		l3 = 1
	} else {
		l3 = 0
	}
	// The fifth corner has all coordinate offsets = 1, so no need to compute that.

	// Offsets for second corner in (x,y,z,w) coords
	x1 := x0 - float64(i1) + G4
	y1 := y0 - float64(j1) + G4
	z1 := z0 - float64(k1) + G4
	w1 := w0 - float64(l1) + G4
	// Offsets for third corner in (x,y,z,w) coords
	x2 := x0 - float64(i2) + 2.0*G4
	y2 := y0 - float64(j2) + 2.0*G4
	z2 := z0 - float64(k2) + 2.0*G4
	w2 := w0 - float64(l2) + 2.0*G4
	// Offsets for fourth corner in (x,y,z,w) coords
	x3 := x0 - float64(i3) + 3.0*G4
	y3 := y0 - float64(j3) + 3.0*G4
	z3 := z0 - float64(k3) + 3.0*G4
	w3 := w0 - float64(l3) + 3.0*G4
	// Offsets for last corner in (x,y,z,w) coords
	x4 := x0 - 1.0 + 4.0*G4
	y4 := y0 - 1.0 + 4.0*G4
	z4 := z0 - 1.0 + 4.0*G4
	w4 := w0 - 1.0 + 4.0*G4

	// Work out the hashed gradient indices of the five simplex corners
	ii := i & 255
	jj := j & 255
	kk := k & 255
	ll := l & 255
	gi0 := so.perm[ii+so.perm[jj+so.perm[kk+so.perm[ll]]]] % 32
	gi1 := so.perm[ii+i1+so.perm[jj+j1+so.perm[kk+k1+so.perm[ll+l1]]]] % 32
	gi2 := so.perm[ii+i2+so.perm[jj+j2+so.perm[kk+k2+so.perm[ll+l2]]]] % 32
	gi3 := so.perm[ii+i3+so.perm[jj+j3+so.perm[kk+k3+so.perm[ll+l3]]]] % 32
	gi4 := so.perm[ii+1+so.perm[jj+1+so.perm[kk+1+so.perm[ll+1]]]] % 32

	// Calculate the contribution from the five corners
	t0 := 0.6 - x0*x0 - y0*y0 - z0*z0 - w0*w0
	if t0 < 0 {
		n0 = 0.0
	} else {
		t0 *= t0
		n0 = t0 * t0 * dot4(GRAD4[gi0], x0, y0, z0, w0)
	}
	t1 := 0.6 - x1*x1 - y1*y1 - z1*z1 - w1*w1
	if t1 < 0 {
		n1 = 0.0
	} else {
		t1 *= t1
		n1 = t1 * t1 * dot4(GRAD4[gi1], x1, y1, z1, w1)
	}
	t2 := 0.6 - x2*x2 - y2*y2 - z2*z2 - w2*w2
	if t2 < 0 {
		n2 = 0.0
	} else {
		t2 *= t2
		n2 = t2 * t2 * dot4(GRAD4[gi2], x2, y2, z2, w2)
	}
	t3 := 0.6 - x3*x3 - y3*y3 - z3*z3 - w3*w3
	if t3 < 0 {
		n3 = 0.0
	} else {
		t3 *= t3
		n3 = t3 * t3 * dot4(GRAD4[gi3], x3, y3, z3, w3)
	}
	t4 := 0.6 - x4*x4 - y4*y4 - z4*z4 - w4*w4
	if t4 < 0 {
		n4 = 0.0
	} else {
		t4 *= t4
		n4 = t4 * t4 * dot4(GRAD4[gi4], x4, y4, z4, w4)
	}

	// Sum up and scale the result to cover the range [-1, 1]
	return 27.0 * (n0 + n1 + n2 + n3 + n4)
}
