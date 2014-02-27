package main

import (
	"fmt"
	"path"
)

func str(i int) string {
	return fmt.Sprintf("%d", i)
}

func worldDir(serverId int) string {
	return path.Join(globalWorldBaseDir, "world"+str(serverId))
}