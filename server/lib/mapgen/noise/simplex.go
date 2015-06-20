package noise

import (
	"math"
	"math/rand"
)

type Simplex struct {
	seed        int64
	persistence float64

	oct  []*SimplexOctave
	freq []float64
	amp  []float64
}

// Persistence is a value [0, 1], where 0 is flat and 1 is vertical cliffs
func NewSimplex(numOctaves int, persistence float64, seed int64) *Simplex {
	sn := new(Simplex)
	sn.seed = seed
	sn.persistence = persistence

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

func (sn *Simplex) Noise2(x, y float64) float64 {
	var result float64
	for i := 0; i < len(sn.oct); i++ {
		result += sn.oct[i].noise2(x/sn.freq[i], y/sn.freq[i]) * sn.amp[i]
	}
	return result
}

func (sn *Simplex) Noise3(x, y, z float64) float64 {
	var result float64
	for i := 0; i < len(sn.oct); i++ {
		result += sn.oct[i].noise3(x/sn.freq[i], y/sn.freq[i], z/sn.freq[i]) * sn.amp[i]
	}
	return result
}
