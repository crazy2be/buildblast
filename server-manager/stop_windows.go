// +build windows

package main

import (
	"log"
	"os"
)

// Go doesn't support signals in windows (pre Go 1.3) because windows doesn't have signals.
// Windows implementation will use kill
func stop(process *os.Process) error {
	err := process.Kill()
	if err != nil {
		log.Println("Error while sending SIG_DEATH to running server:", err)
		return err
	}
	return nil
}
