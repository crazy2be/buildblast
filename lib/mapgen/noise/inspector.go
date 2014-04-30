package noise

import (
	"log"
	"math"
)

type Inspector struct {
	Total float64
	Count float64
	Min   float64
	Max   float64
}

func NewInspector() *Inspector {
	return new(Inspector)
}

func (i *Inspector) Record(value float64) {
	i.Total += value
	i.Count++
	i.Min = math.Min(i.Min, value)
	i.Max = math.Max(i.Max, value)
}

func (i *Inspector) Log() {
	log.Println("Average:", i.Total/i.Count,
		"Min:", i.Min,
		"Max:", i.Max)
}
