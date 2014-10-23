package noise

import (
	"math"
)

type RidgedMultifractalFilter struct {
	numOctaves    int
	offset        float64
	lacunarity    float64
	gain          float64
	exponentArray []float64
}

/*
 * Some good parameter values to start with:
 *
 *      H:           1.0
 *      offset:      1.0
 *      gain:        2.0
 */
func NewRidgedMultifractalFilter(numOctaves int, offset, lacunarity, gain, H float64) *RidgedMultifractalFilter {
	rm := new(RidgedMultifractalFilter)
	rm.numOctaves = numOctaves
	rm.offset = offset
	rm.lacunarity = lacunarity
	rm.gain = gain
	rm.exponentArray = make([]float64, numOctaves+1)

	// Precompute and store spectral weights.
	frequency := 1.0
	for i := 0; i <= numOctaves; i++ {
		// Compute weight for each frequency.
		rm.exponentArray[i] = math.Pow(frequency, -H)
		frequency *= lacunarity
	}
	return rm
}

func (rm *RidgedMultifractalFilter) Filter(x, y, z float64, source Source3d) float64 {
	signal := source.Noise3(x, y, z)

	// Get absolute value of signal (this creates the ridges).
	if signal < 0 {
		signal = -signal
	}
	// Invert and translate (note that "offset" should be ~= 1.0).
	signal = rm.offset - signal
	// Square the signal, to increase "sharpness" of ridges.
	signal *= signal

	// Assign initial values
	result := signal
	weight := 1.0
	for i := 1; i < rm.numOctaves; i++ {
		// increase the frequency
		x *= rm.lacunarity
		y *= rm.lacunarity
		z *= rm.lacunarity

		// weight successive contributions by previous signal
		weight = signal * rm.gain
		if weight > 1 {
			weight = 1.0
		}
		if weight < 0.0 {
			weight = 0.0
		}
		signal = source.Noise3(x, y, z)
		if signal < 0.0 {
			signal = -signal
		}
		signal = rm.offset - signal
		signal *= signal
		// weight the contribution
		signal *= weight
		result += signal * rm.exponentArray[i]
	}

	return result
}
