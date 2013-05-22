package main

import (
	"buildblast/coords"
)

type PlayerHistoryEntry struct {
	pos coords.World
	// JavaScript performance.now() timestamp.
	t float64
}

type PlayerHistory struct {
	buf []PlayerHistoryEntry
	offset int
}

func NewPlayerHistory() *PlayerHistory {
	ph := new(PlayerHistory)
	ph.buf = make([]PlayerHistoryEntry, 100)
	return ph
}

func (ph *PlayerHistory) Add(t float64, pos coords.World) {
	ph.buf[ph.offset] = PlayerHistoryEntry{pos, t}
	ph.offset++
	if ph.offset >= len(ph.buf) {
		ph.offset = 0
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

	newest := ph.buf[((ph.offset - 1) + l) % l]
	if newest.t <= t {
		// We could extrapolate, but this should do.
		return newest.pos
	}

	oldest := ph.buf[(ph.offset + l) % l]
	if oldest.t >= t {
		return oldest.pos
	}

	var older PlayerHistoryEntry
	var newer PlayerHistoryEntry
	for i := 1; i <= l; i++ {
		older = ph.buf[((ph.offset - i) + l) % l]
		if older.t <= t {
			break
		}
		newer = older
	}

	if older.t == t {
		return older.pos
	}

	p1 := older.pos
	p3 := newer.pos

	// t1        t2     t3
	// |          |     |
	// older.t    t   newer.t
	t13 := newer.t - older.t
	t12 := t - older.t

	r := t12 / t13
	p13 := coords.Vec3{
		X: p3.X - p1.X,
		Y: p3.Y - p1.Y,
		Z: p3.Z - p1.Z,
	}

	return coords.World{
		X: p1.X + p13.X*r,
		Y: p1.Y + p13.Y*r,
		Z: p1.Z + p13.Z*r,
	}
}
