// +build !windows

package main

import (
	"log"
	"os"
)

func stop(process *os.Process) error {
	err := process.Signal(os.Interrupt)
	if err != nil {
		log.Println("Error while sending SIGINT to running server:", err)
	}
	_, err = process.Wait()
	return err
}
