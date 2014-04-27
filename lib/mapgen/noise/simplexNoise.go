package noise

import (
	"math"
	"math/rand"
)

type SimplexNoise struct {
	seed           int64
	largestFeature int
	persistence    float64

	octaves     []*SimplexOctave
	frequencies []float64
	amplitudes  []float64
}

func NewSimplexNoise(largestFeature int, persistence float64, seed int64) *SimplexNoise {
	sn := new(SimplexNoise)
	sn.seed = seed
	sn.largestFeature = largestFeature
	sn.persistence = persistence

	// Calculate which power of 2 largestFeature is
	numOctaves := int(math.Ceil(math.Log10(float64(largestFeature)) / math.Log10(2)))
	sn.octaves = make([]*SimplexOctave, numOctaves)
	sn.frequencies = make([]float64, numOctaves)
	sn.amplitudes = make([]float64, numOctaves)

	randGen := rand.New(rand.NewSource(seed))
	for i := 0; i < numOctaves; i++ {
		sn.octaves[i] = NewSimplexOctave(randGen.Int63())
		sn.frequencies[i] = math.Pow(2, float64(i))
		sn.amplitudes[i] = math.Pow(persistence, float64(numOctaves-i))
	}

	return sn
}

func (sn *SimplexNoise) Noise2(x, y float64) float64 {
	var result float64
	for i := 0; i < len(sn.octaves); i++ {
		result += sn.octaves[i].noise2(x/sn.frequencies[i], y/sn.frequencies[i]) * sn.amplitudes[i]
	}
	return result
}
