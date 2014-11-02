package game

import (
	"buildblast/lib/physics"
)

type HistoryEntry struct {
	body physics.Body
	t    float64 // JavaScript performance.now() timestamp.
}

type HistoryBuffer struct {
	buf    []HistoryEntry
	offset int
}

func NewHistoryBuffer() *HistoryBuffer {
	ph := new(HistoryBuffer)
	ph.buf = make([]HistoryEntry, 101)
	return ph
}

func (ph *HistoryBuffer) Add(t float64, body physics.Body) {
	ph.offset++
	if ph.offset >= len(ph.buf) {
		ph.offset = 0
	}
	ph.buf[ph.offset] = HistoryEntry{body, t}
}

func mod(a, b int) int {
	// Go has the same problem as JavaScript...
	// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
	return ((a % b) + b) % b
}

func (ph *HistoryBuffer) at(i int) HistoryEntry {
	l := len(ph.buf)
	return ph.buf[mod(ph.offset+i, l)]
}

func (ph *HistoryBuffer) set(i int, val HistoryEntry) {
	l := len(ph.buf)
	ph.buf[mod(ph.offset+i, l)] = val
}

func (ph *HistoryBuffer) Clear() {
	l := len(ph.buf)
	for i := 0; i < l; i++ {
		ph.set(i, HistoryEntry{})
	}
}

// If t > most recent time added, return most recent
// position added. If t < ring buffer history, return
// oldest position stored. If t == an entry in the
// ring buffer, return that entry. If t is between
// two entries in the ring buffer, interpolate
// between them.
func (ph *HistoryBuffer) BodyAt(t float64) *physics.Body {
	l := len(ph.buf)
	if l < 0 {
		panic("Attempt to access item in empty history buffer!")
	}

	newest := ph.at(l - 1)
	if newest.t <= t {
		// We could extrapolate, but this should do.
		return physics.CloneBody(&newest.body)
	}

	oldest := ph.at(0)
	if oldest.t >= t {
		// We don't go back that far :(
		return physics.CloneBody(&oldest.body)
	}

	older := newest
	newer := newest
	// Go backwards, (in time and indicies), looking
	// for a pair to interpolate between.
	for i := l - 2; i >= 0; i-- {
		older = ph.at(i)
		if older.t <= t {
			break
		}
		newer = older
	}

	alpha := (t - older.t) / (newer.t - older.t)
	return &physics.Body{
		Pos:          *older.body.Pos.Lerp(&newer.body.Pos, alpha),
		Vel:          *older.body.Vel.Lerp(&newer.body.Vel, alpha),
		Dir:          *older.body.Dir.Lerp(&newer.body.Dir, alpha),
		HalfExtents:  newer.body.HalfExtents,
		CenterOffset: newer.body.CenterOffset,
	}
}
