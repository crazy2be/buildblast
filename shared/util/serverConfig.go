package util

import (
	"encoding/hex"
	"encoding/json"
	"log"
	"os"
	"strconv"
)

type ServerConfig struct {
	Host           string
	WwwPort        string
	ServerPort     string
	ClientAssets   string
	PersistEnabled bool
	WorldBaseDir   string
	DbPass         string
	MailPass       string
	CookieKeyPairs [][]byte
}

type serverConfigJson struct {
	Host           string
	Port           int
	ClientAssets   string   `json:"client_assets"`
	PersistEnabled bool     `json:"persist_enabled"`
	WorldBaseDir   string   `json:"world_base_dir"`
	DbPass         string   `json:"db_pass"`
	MailPass       string   `json:"mail_pass"`
	CookieKeyPairs []string `json:"cookie_key_pairs"`
}

func LoadServerConfig(path string) *ServerConfig {
	file, err := os.Open(path)
	if err != nil {
		log.Fatalln("Couldn't open server config file:", err)
	}
	defer file.Close()

	var configJson serverConfigJson
	err = json.NewDecoder(file).Decode(&configJson)
	if err != nil {
		log.Fatalln("Couldn't decode server config file:", err)
	}

	serverConfig := new(ServerConfig)
	serverConfig.Host = configJson.Host
	serverConfig.WwwPort = strconv.Itoa(configJson.Port)
	serverConfig.ServerPort = strconv.Itoa(configJson.Port + 1)
	serverConfig.ClientAssets = configJson.ClientAssets
	serverConfig.PersistEnabled = configJson.PersistEnabled
	serverConfig.WorldBaseDir = configJson.WorldBaseDir
	serverConfig.DbPass = configJson.DbPass
	serverConfig.MailPass = configJson.MailPass

	serverConfig.CookieKeyPairs = make([][]byte, 2)
	for i, v := range configJson.CookieKeyPairs {
		byteKey, err := hex.DecodeString(v)
		keylen := len(byteKey)

		if err != nil && !(i%2 == 0 || keylen == 16 || keylen == 24 || keylen == 32) {
			log.Fatalln("Encryption key must be a 16, 24 or 32 byte hex string")
		}
		serverConfig.CookieKeyPairs[i] = byteKey
	}

	return serverConfig
}
