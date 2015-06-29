package util

import (
	"html/template"
	"log"
)

func ParseTemplates(templates map[string]*template.Template, templatePaths map[string]string) {
	var err error
	for name, path := range templatePaths {
		templates[name], err = template.ParseFiles(path)
		if err != nil {
			log.Fatalln("Creating template:", err)
		}
	}
}
