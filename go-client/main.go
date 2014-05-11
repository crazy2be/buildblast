package main

import (
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"log"
)

var g_vertex_buffer_data []float32
var g_element_buffer_data []uint16 = []uint16{
	0, 3, 2,
	0, 1, 3,
	4, 7, 5,
	4, 6, 7,
	2, 3, 7,
	2, 7, 6,
	0, 4, 5,
	0, 5, 1,
	1, 5, 7,
	1, 7, 3,
	0, 6, 4,
	0, 2, 6,
}

var g_window *glfw.Window

func set_3d(matrix *Matrix) {
    w, h := g_window.GetSize();
    gl.Enable(gl.DEPTH_TEST);
    gl.Viewport(0, 0, w, h);
    matrix.Perspective(65.0, float32(w)/float32(h), 0.1, 60.0);
}


func errorCallback(err glfw.ErrorCode, desc string) {
	log.Fatal("glfw: ", err, desc)
}

func main() {
	glfw.SetErrorCallback(errorCallback)

    if (!glfw.Init()) {
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

	g_vertex_buffer_data = make([]float32, 24)
    make_cube(g_vertex_buffer_data, 0, 0, -10, 0.5);

	vertex_buffer := make_buffer(
        gl.ARRAY_BUFFER,
        len(g_vertex_buffer_data)*4,
        g_vertex_buffer_data);
    element_buffer := make_buffer(
        gl.ELEMENT_ARRAY_BUFFER,
        len(g_element_buffer_data)*2,
        g_element_buffer_data);

	vertex_shader := load_shader(gl.VERTEX_SHADER, "shaders/block_vertex.glsl");
    fragment_shader := load_shader(gl.FRAGMENT_SHADER, "shaders/block_fragment.glsl");
    program := make_program(vertex_shader, fragment_shader);

    var matrix Matrix
    for !g_window.ShouldClose() {
        gl.ClearColor(0.5, 0.69, 1.0, 1);
        gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        set_3d(&matrix);

		program.GetUniformLocation("matrix").UniformMatrix4fv(false, matrix)
		program.GetUniformLocation("timer").Uniform1f(float32(glfw.GetTime()))
        program.Use()

        index := program.GetAttribLocation("position");
        vertex_buffer.Bind(gl.ARRAY_BUFFER);
        index.AttribPointer(3, gl.FLOAT, false, 4 * 3, nil);
        index.EnableArray()
        element_buffer.Bind(gl.ELEMENT_ARRAY_BUFFER)
        gl.DrawElements(gl.TRIANGLES, 36, gl.UNSIGNED_SHORT, nil);
        index.DisableArray()

        g_window.SwapBuffers();
    }
}
