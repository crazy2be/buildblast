package game

import (
	"buildblast/lib/coords"
)

type HistoryEntry struct {
	pos coords.World
	// JavaScript performance.now() timestamp.
	t float64
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

func (ph *HistoryBuffer) Add(t float64, pos coords.World) {
	ph.offset--
	if ph.offset < 0 {
		ph.offset = len(ph.buf) - 1
	}
	ph.buf[ph.offset] = HistoryEntry{pos, t}
}

func mod(i int, modulos int) int {
	// Go has the same problem as JavaScript...
	// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
	return ((i % modulos) + modulos) % modulos
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

//http://docs.unity3d.com/Documentation/ScriptReference/Vector3.Lerp.html
func lerp(older HistoryEntry, newer HistoryEntry, t float64) coords.World {
	timeSpan := newer.t - older.t
	oldWeight := (t - older.t) / timeSpan
	newWeight := (newer.t - t) / timeSpan

	return coords.World{
		X: older.pos.X*oldWeight + newer.pos.X*newWeight,
		Y: older.pos.Y*oldWeight + newer.pos.Y*newWeight,
		Z: older.pos.Z*oldWeight + newer.pos.Z*newWeight,
	}
}

// If t > most recent time added, return most recent
// position added. If t < ring buffer history, return
// oldest position stored. If t == an entry in the
// ring buffer, return that entry. If t is between
// two entries in the ring buffer, interpolate
// between them.
func (ph *HistoryBuffer) PositionAt(t float64) coords.World {
	l := len(ph.buf)

	newest := ph.at(0)
	if newest.t <= t {
		// We could extrapolate, but this should do.
		return newest.pos
	}

	oldest := ph.at(-1)
	if oldest.t >= t {
		return oldest.pos
	}

	older := newest
	newer := newest
	for i := 1; i <= l; i++ {
		older = ph.at(i)
		if older.t <= t {
			break
		}
		newer = older
	}

	if older.t == t {
		return older.pos
	}

	return lerp(older, newer, t)
}
