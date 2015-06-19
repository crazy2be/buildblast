package pages

import (
	"net/http"
)

type Index struct{}

func (i Index) Process(c *Context, w http.ResponseWriter, r *http.Request) {
	var err error
	c.ParseFlashes()
	c.SaveSession()

	c.pageVals["title"] = "BuildBlast - Home"
	err = templates["header"].Execute(w, c.pageVals)
	templateExecuteErr(err)
	err = templates["index"].Execute(w, c.pageVals)
	templateExecuteErr(err)
	err = templates["footer"].Execute(w, c.pageVals)
}
