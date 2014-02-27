// +build !windows

package main

import (
	"log"
	"os"
)

// Go doesn't support signals in windows (pre Go 1.3) because windows doesn't have signals.
// Non-windows implementation will use signals
func stop(process *os.Process) error {
	err := process.Signal(os.Interrupt)
	if err != nil {
		log.Println("Error while sending SIGINT to running server:", err)
		return err
	}
	_, err = process.Wait()
	return err
}
