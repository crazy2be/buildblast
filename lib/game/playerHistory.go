package game

//This serves the same purpose as "HistoryBuffer" on the client,
//	but the client wraps it a few times to add input prediction
//	and lag induction.

import (
	"buildblast/lib/coords"
)

type PlayerHistoryEntry struct {
	pos coords.World
	// JavaScript performance.now() timestamp.
	t float64
}

type PlayerHistory struct {
	buf    []PlayerHistoryEntry
	offset int
}

func NewPlayerHistory() *PlayerHistory {
	ph := new(PlayerHistory)
	ph.buf = make([]PlayerHistoryEntry, 1000)
	return ph
}

func (ph *PlayerHistory) Add(t float64, pos coords.World) {
	ph.offset--
	if ph.offset < 0 {
		ph.offset = len(ph.buf) - 1
	}
	ph.buf[ph.offset] = PlayerHistoryEntry{pos, t}
}

func mod(i int, modulos int) int {
	// Go has the same problem as JavaScript...
	// http://stackoverflow.com/questions/4467539/javascript-modulo-not-behaving
	return (i % modulos + modulos) % modulos;
}

func (ph *PlayerHistory) at(i int) PlayerHistoryEntry {
	l := len(ph.buf)
	return ph.buf[mod(ph.offset+i, l)]
}

func (ph *PlayerHistory) set(i int, val PlayerHistoryEntry) {
	l := len(ph.buf)
	ph.buf[mod(ph.offset+i, l)] = val
}

func (ph *PlayerHistory) Clear() {
	l := len(ph.buf)
	for i := 0; i < l; i++ {
		ph.set(i, PlayerHistoryEntry{})
	}
}

//http://docs.unity3d.com/Documentation/ScriptReference/Vector3.Lerp.html
func lerp (older PlayerHistoryEntry, newer PlayerHistoryEntry, t float64) coords.World {
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
func (ph *PlayerHistory) PositionAt(t float64) coords.World {
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
