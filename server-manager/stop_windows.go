// +build windows

package main

import (
	"log"
	"os"
)

func stop(process *os.Process) error {
	err := process.Kill()
	if err != nil {
		log.Println("Error while sending SIG_DEATH to running server:", err)
		return err
	}
	return nil
}
