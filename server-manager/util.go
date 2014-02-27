package main

import (
	"fmt"
	"log"
	"os"
	"path"
)

func str(i int) string {
	return fmt.Sprintf("%d", i)
}

func worldFilePath(serverId int, name string) string {
	return path.Join(worldDir(serverId), name)
}

func worldDir(serverId int) string {
	return path.Join(globalWorldBaseDir, "world"+str(serverId))
}

func createWorldDir(serverId int) error {
	err := os.MkdirAll(worldDir(serverId), 0755)
	if err != nil {
		log.Println("Error creating required directories:", err)
	}
	return err
}
