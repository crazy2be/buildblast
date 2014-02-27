package main

import (
	"sync"
)

var BASE_PORT = 10000

type PortMapper struct {
	portSequence int
	freePorts    []int
	mutex        sync.Mutex
}

func (pm *PortMapper) getPort() int {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()
	if len(pm.freePorts) == 0 {
		result := pm.portSequence
		pm.portSequence++
		return result
	}
	result := pm.freePorts[len(pm.freePorts)-1]
	pm.freePorts = pm.freePorts[:len(pm.freePorts)-1]
	return result
}

func (pm *PortMapper) freePort(port int) {
	pm.mutex.Lock()
	defer pm.mutex.Unlock()
	pm.freePorts = append(pm.freePorts, port)
}

func NewPortMapper() *PortMapper {
	return &PortMapper{
		freePorts: make([]int, 0, 10),
	}
}

type IdSequence struct {
	nextValue int
	mutex     sync.Mutex
}

func (is *IdSequence) getId() int {
	is.mutex.Lock()
	defer is.mutex.Unlock()
	result := is.nextValue
	is.nextValue++
	return result
}

func (is *IdSequence) updateSequence(usedValue int) {
	if usedValue >= is.nextValue {
		is.nextValue = usedValue + 1
	}
}