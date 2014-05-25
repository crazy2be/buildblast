package main

import (
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"log"
)

func updateProjection(projection *Matrix, window *glfw.Window) {
	w, h := window.GetSize()
	gl.Enable(gl.DEPTH_TEST)
	gl.Viewport(0, 0, w, h)
	projection.Perspective(65.0, float32(w)/float32(h), 0.1, 100.0)
}


func errorCallback(err glfw.ErrorCode, desc string) {
	log.Fatal("glfw: ", err, desc)
}

func main() {
	glfw.SetErrorCallback(errorCallback)

	if !glfw.Init() {
		log.Fatal("glfw init")
	}

	window, err := glfw.CreateWindow(800, 600, "Modern GL", nil, nil)
	if err != nil {
		log.Fatal("window create", err)
	}
	window.MakeContextCurrent()

	if gl.Init() != gl.FALSE {
		log.Fatal("gl init")
	}

	chunk := NewChunkGeometry()
	chunk.Add(2, 0, 0, 0)
	chunk.Add(3, 1, 1, 0)
	chunk.Add(4, -1, 1, 0)
	chunk.Add(5, 1, -1, 0)
	chunk.Add(6, -1, -1, 0)

	chunkMesh := NewChunkMesh(chunk)

	vertex_shader := load_shader(gl.VERTEX_SHADER, "shaders/block_vertex.glsl")
	fragment_shader := load_shader(gl.FRAGMENT_SHADER, "shaders/block_fragment.glsl")
	program := make_program(vertex_shader, fragment_shader)

	gl.ActiveTexture(gl.TEXTURE0)
	texture := loadTexture("../client/img/block_textures/atlas.png")
	texture.Bind(gl.TEXTURE_2D)

	var projection Matrix
	updateProjection(&projection, window)

	var view Matrix
	view.Identity()
	window.SetKeyCallback(func (window *glfw.Window, key glfw.Key, scancode int, action glfw.Action, mods glfw.ModifierKey) {
		switch key {
		case glfw.KeyUp:
			view.Translate(0, 0, 1)
		case glfw.KeyDown:
			view.Translate(0, 0, -1)
		case glfw.KeyLeft:
			view.Translate(1, 0, 0)
		case glfw.KeyRight:
			view.Translate(-1, 0, 0)
		}
	})

	theta := 0.0
	for !window.ShouldClose() {
		var model Matrix
		model.Identity()
// 		model.RotateX(0.002)
		model.Translate(0, 0, -5)
		model.RotateY(theta)
		theta += 0.01
		model.Translate(-0.5, -0.5, 0)
// 		model.RotateZ(0.005)

		var mvp Matrix
		mvp.Identity()
		mvp.Multiply(&projection, &view)
		mvp.Multiply(&mvp, &model)

		gl.ClearColor(0.5, 0.69, 1.0, 1)
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		program.GetUniformLocation("matrix").UniformMatrix4fv(false, mvp)
		program.GetUniformLocation("timer").Uniform1f(float32(glfw.GetTime()))
		program.GetUniformLocation("sampler").Uniform1i(0) // Texture unit #
		program.Use()

		chunkMesh.Draw(program)

		window.SwapBuffers()
		glfw.PollEvents()
	}
}
