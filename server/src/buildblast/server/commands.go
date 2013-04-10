package main

import (
	"log"
	"strings"
)

const (
	COMMAND_PREFIX = "/"
	TAG = "[COMMAND]"
)

func HandleCommand(c *Client, command string) bool {
	if !strings.HasPrefix(command, COMMAND_PREFIX) {
		return false
	}

	var offset = strings.Index(command, "/name ")
	if offset != -1 {
		command = command[6:]
		log.Println(TAG, "Attempting to change display name:", c.displayName, "to", command)
		oldName := c.displayName
		if handleChangeName(c, command) {
			globalWorld.announce(oldName + " is now known as " + command)
		}
		return true
	} else {
		log.Println(TAG, "Invalid command: (", c.name, ")", command)
		c.announce("Invalid command: " + command)
		return true;
	}
	return false;
}

func handleChangeName(c *Client, newName string) bool {
	if strings.ToUpper(newName) == "SERVER" {
		c.announce(newName + " is reserved")
		return false;
	}
	c.displayName = newName
	return true;
}