package main

import (
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"log"
)


var g_window *glfw.Window

func set_3d(matrix *Matrix) {
	w, h := g_window.GetSize()
	gl.Enable(gl.DEPTH_TEST)
	gl.Viewport(0, 0, w, h)
	matrix.Perspective(65.0, float32(w)/float32(h), 0.1, 100.0)
}

func errorCallback(err glfw.ErrorCode, desc string) {
	log.Fatal("glfw: ", err, desc)
}

func main() {
	glfw.SetErrorCallback(errorCallback)

	if !glfw.Init() {
		log.Fatal("glfw init")
	}

	var err error
	g_window, err = glfw.CreateWindow(800, 600, "Modern GL", nil, nil)
	if err != nil {
		log.Fatal("window create", err)
	}
	g_window.MakeContextCurrent()

	if gl.Init() != gl.FALSE {
		log.Fatal("gl init")
	}

	chunk := NewChunkGeometry()
	chunk.Add(0, 0, 0)
	chunk.Add(1, 1, 0)
	chunk.Add(-1, 1, 0)
	chunk.Add(1, -1, 0)
	chunk.Add(-1, -1, 0)

	vertex_buffer := make_buffer(
		gl.ARRAY_BUFFER,
		len(chunk.arrayBuffer)*4,
		chunk.arrayBuffer)
	element_buffer := make_buffer(
		gl.ELEMENT_ARRAY_BUFFER,
		len(chunk.elementArrayBuffer)*2,
		chunk.elementArrayBuffer)

	vertex_shader := load_shader(gl.VERTEX_SHADER, "shaders/block_vertex.glsl")
	fragment_shader := load_shader(gl.FRAGMENT_SHADER, "shaders/block_fragment.glsl")
	program := make_program(vertex_shader, fragment_shader)

	gl.ActiveTexture(gl.TEXTURE0)
	texture := loadTexture("../client/img/block_textures/atlas.png")
	texture.Bind(gl.TEXTURE_2D)

	var projection Matrix
	set_3d(&projection)
	theta := 0.0
	for !g_window.ShouldClose() {
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
		mvp.Multiply(&projection, &model)
		gl.ClearColor(0.5, 0.69, 1.0, 1)
		gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

		program.GetUniformLocation("matrix").UniformMatrix4fv(false, mvp)
		program.GetUniformLocation("timer").Uniform1f(float32(glfw.GetTime()))
		program.GetUniformLocation("sampler").Uniform1i(0) // Texture unit #
		program.Use()

		vertex_buffer.Bind(gl.ARRAY_BUFFER)
		position := program.GetAttribLocation("position")
		position.AttribPointer(3, gl.FLOAT, false, 4*5, uintptr(0))
		position.EnableArray()
		uv := program.GetAttribLocation("uv")
		uv.AttribPointer(2, gl.FLOAT, false, 4*5, uintptr(4*3))
		uv.EnableArray()

		element_buffer.Bind(gl.ELEMENT_ARRAY_BUFFER)
		gl.DrawElements(gl.TRIANGLES, len(chunk.elementArrayBuffer), gl.UNSIGNED_SHORT, nil)

		uv.DisableArray()
		position.DisableArray()

		g_window.SwapBuffers()
		glfw.PollEvents()
	}
}
