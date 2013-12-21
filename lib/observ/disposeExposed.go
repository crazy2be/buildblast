package observ

import (
	"fmt"
	"runtime"
)

//These are never decremented, only incremented. This means,
//allocated - finalized = cur allocated
//_diposedObjectCounts - _finalizedObjectCounts = LEAKED
var _allocatedObjectCounts map[string]int
var _disposedObjectCounts map[string]int
var _finalizedObjectCounts map[string]int

type DisposeExposed interface {
	OnDispose(func())
	Dispose()
	WatchLeaks(objName string)
}

type DisposeExposedImpl struct {
	disposeCallbacks []func()
	objName          string
	disposed         bool
}

//TODO: Add a way to unsubscribe for OnDispose
func (c *DisposeExposedImpl) OnDispose(callback func()) {
	c.disposeCallbacks = append(c.disposeCallbacks, callback)
}
func (c *DisposeExposedImpl) Dispose() {
	if c.disposed {
		fmt.Println("Error, called Dispose twice on", c.objName)
	}

	c.disposed = true

	for _, callback := range c.disposeCallbacks {
		callback()
	}

	if c.objName != "" {
		_disposedObjectCounts[c.objName] = _disposedObjectCounts[c.objName] + 1
	}

	c.disposeCallbacks = nil
}
func (c *DisposeExposedImpl) WatchLeaks(objName string) {
	if _allocatedObjectCounts == nil {
		_allocatedObjectCounts = make(map[string]int, 0)
		_disposedObjectCounts = make(map[string]int, 0)
		_finalizedObjectCounts = make(map[string]int, 0)
	}

	c.objName = objName

	//Not thread safe... but that is okay...
	_, exists := _allocatedObjectCounts[objName]
	if !exists {
		_allocatedObjectCounts[objName] = 0
		_disposedObjectCounts[objName] = 0
		_finalizedObjectCounts[objName] = 0
	}
	_allocatedObjectCounts[objName] = _allocatedObjectCounts[objName] + 1

	runtime.SetFinalizer(c, ObjFinalizer)
}
func ObjFinalizer(c *DisposeExposedImpl) {
	_finalizedObjectCounts[c.objName] = _finalizedObjectCounts[c.objName] + 1
}

func PrintLeaks() bool {
	runtime.GC()
	//Not thread safe...
	anyLeaks := false
	for objName, allocatedCount := range _allocatedObjectCounts {
		disposedCount := _disposedObjectCounts[objName]
		finalizedCount := _finalizedObjectCounts[objName]

		liveCount := allocatedCount - disposedCount
		leakedCount := disposedCount - finalizedCount

		if leakedCount != 0 {
			anyLeaks = true
			fmt.Println("Leaked", leakedCount, objName, "out of", allocatedCount, "allocated (", liveCount, "live )")
		}
	}

	return anyLeaks
}
