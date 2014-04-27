package noise

import (
	"math"
	"math/rand"
)

type SimplexNoise struct {
	seed           int64
	largestFeature int
	persistence    float64

	oct  []*SimplexOctave
	freq []float64
	amp  []float64
}

func NewSimplexNoise(largestFeature int, persistence float64, seed int64) *SimplexNoise {
	sn := new(SimplexNoise)
	sn.seed = seed
	sn.largestFeature = largestFeature
	sn.persistence = persistence

	// Calculate which power of 2 largestFeature is
	numOctaves := int(math.Ceil(math.Log10(float64(largestFeature)) / math.Log10(2)))
	sn.oct = make([]*SimplexOctave, numOctaves)
	sn.freq = make([]float64, numOctaves)
	sn.amp = make([]float64, numOctaves)

	randGen := rand.New(rand.NewSource(seed))
	for i := 0; i < numOctaves; i++ {
		sn.oct[i] = NewSimplexOctave(randGen.Int63())
		sn.freq[i] = math.Pow(2, float64(i))
		sn.amp[i] = math.Pow(persistence, float64(numOctaves-i))
	}

	return sn
}

func (sn *SimplexNoise) Noise2(x, y float64) float64 {
	var result float64
	for i := 0; i < len(sn.oct); i++ {
		result += sn.oct[i].noise2(x/sn.freq[i], y/sn.freq[i]) * sn.amp[i]
	}
	return result
}

func (sn *SimplexNoise) Noise3(x, y, z float64) float64 {
	var result float64
	for i := 0; i < len(sn.oct); i++ {
		result += sn.oct[i].noise3(x/sn.freq[i], y/sn.freq[i], z/sn.freq[i]) * sn.amp[i]
	}
	return result
}
