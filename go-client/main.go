// Copyright 2012 The go-gl Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"fmt"
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"os"
)

const (
	Title  = "Spinning Gopher"
	Width  = 640
	Height = 480
)

var (
	texture    gl.Texture
	rotx, roty float32
	ambient    []float32 = []float32{0.5, 0.5, 0.5, 1}
	diffuse    []float32 = []float32{1, 1, 1, 1}
	lightpos   []float32 = []float32{-5, 5, 10, 0}
	window *glfw.Window
)

func errorCallback(err glfw.ErrorCode, desc string) {
	fmt.Printf("%v: %v\n", err, desc)
}

func main() {
	glfw.SetErrorCallback(errorCallback)

	if !glfw.Init() {
		panic("Can't init glfw!")
	}
	defer glfw.Terminate()

	var err error
	window, err = glfw.CreateWindow(Width, Height, Title, nil, nil)
	if err != nil {
		panic(err)
	}

	window.MakeContextCurrent()

	glfw.SwapInterval(1)

	// This calls glew.Init() for us.
	gl.Init()

	if err := initScene(); err != nil {
		fmt.Fprintf(os.Stderr, "init: %s\n", err)
		return
	}
	defer destroyScene()

	for !window.ShouldClose() {
		drawScene()
		window.SwapBuffers()
		glfw.PollEvents()
	}
}

type BlockProgram struct {
	program  gl.Program

	position gl.AttribLocation
	normal   gl.AttribLocation
	uv       gl.AttribLocation

	matrix  gl.UniformLocation
	sampler gl.UniformLocation
	extra1  gl.UniformLocation
	extra2  gl.UniformLocation
	extra3  gl.UniformLocation
	extra4  gl.UniformLocation
	camera  gl.UniformLocation
	timer   gl.UniformLocation
}

var block_attrib BlockProgram

func initScene() (err error) {
	gl.Enable(gl.CULL_FACE)
// 	gl.Enable(gl.TEXTURE_2D)
	gl.Enable(gl.DEPTH_TEST)
	gl.LogicOp(gl.INVERT)
// 	gl.Enable(gl.LIGHTING)
	gl.ClearColor(0, 0, 0, 1)

// 	gl.ClearColor(0.5, 0.5, 0.5, 0.0)
// 	gl.ClearDepth(1)
// 	gl.DepthFunc(gl.LEQUAL)

// 	gl.Lightfv(gl.LIGHT0, gl.AMBIENT, ambient)
// 	gl.Lightfv(gl.LIGHT0, gl.DIFFUSE, diffuse)
// 	gl.Lightfv(gl.LIGHT0, gl.POSITION, lightpos)
// 	gl.Enable(gl.LIGHT0)

	gl.Viewport(0, 0, Width, Height)
	gl.MatrixMode(gl.PROJECTION)
	gl.LoadIdentity()
	gl.Frustum(-1, 1, -1, 1, 1.0, 10.0)
	gl.MatrixMode(gl.MODELVIEW)
	gl.LoadIdentity()

	texture = loadTexture("../client/img/block_textures/atlas.png")

	// Create programs
	program := loadProgram(
        "shaders/block_vertex.glsl", "shaders/block_fragment.glsl");
    block_attrib.program  = program;
    block_attrib.position = program.GetAttribLocation("position");
    block_attrib.normal   = program.GetAttribLocation("normal");
    block_attrib.uv       = program.GetAttribLocation("uv");
    block_attrib.matrix   = program.GetUniformLocation("matrix");
    block_attrib.sampler  = program.GetUniformLocation("sampler");
    block_attrib.extra1   = program.GetUniformLocation("sky_sampler");
    block_attrib.extra2   = program.GetUniformLocation("daylight");
    block_attrib.extra3   = program.GetUniformLocation("fog_distance");
    block_attrib.extra4   = program.GetUniformLocation("ortho");
    block_attrib.camera   = program.GetUniformLocation("camera");
    block_attrib.timer    = program.GetUniformLocation("timer");

	return
}

func destroyScene() {
	texture.Delete()
}

func drawScene() {
	gl.Clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

	gl.MatrixMode(gl.MODELVIEW)
	gl.LoadIdentity()
	gl.Translatef(0, 0, -3.0)
	gl.Rotatef(rotx, 1, 0, 0)
	gl.Rotatef(roty, 0, 1, 0)

	rotx += 0.5
	roty += 0.5

	texture.Bind(gl.TEXTURE_2D)

	gl.Color4f(1, 1, 1, 1)

	gl.Begin(gl.QUADS)

	gl.Normal3f(0, 0, 1)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(-1, -1, 1)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(1, -1, 1)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(1, 1, 1)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(-1, 1, 1)

	gl.Normal3f(0, 0, -1)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(-1, -1, -1)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(-1, 1, -1)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(1, 1, -1)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(1, -1, -1)

	gl.Normal3f(0, 1, 0)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(-1, 1, -1)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(-1, 1, 1)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(1, 1, 1)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(1, 1, -1)

	gl.Normal3f(0, -1, 0)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(-1, -1, -1)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(1, -1, -1)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(1, -1, 1)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(-1, -1, 1)

	gl.Normal3f(1, 0, 0)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(1, -1, -1)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(1, 1, -1)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(1, 1, 1)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(1, -1, 1)

	gl.Normal3f(-1, 0, 0)
	gl.TexCoord2f(0, 0)
	gl.Vertex3f(-1, -1, -1)
	gl.TexCoord2f(1, 0)
	gl.Vertex3f(-1, -1, 1)
	gl.TexCoord2f(1, 1)
	gl.Vertex3f(-1, 1, 1)
	gl.TexCoord2f(0, 1)
	gl.Vertex3f(-1, 1, -1)

	gl.End()

// 	renderChunks(block_attrib)
}

func WindowMatrix() Matrix {
	w, h := window.GetSize()
	gl.Viewport(0, 0, w, h)
	return MakePerspective(65.0, float32(w)/float32(h), 0.1, 60.0)
}

func renderChunks(attrib *BlockProgram) {
	x := float32(0.0)
	y := float32(0.0)
	z := float32(0.0)
	ortho := 0 // no boolean for shaders?
//     float light = get_daylight();
	light := float32(0.5)
	time := float32(0.5)
	matrix := WindowMatrix()
//     float matrix[16];
//     set_matrix_3d(
//         matrix, g->width, g->height,
//         s->x, s->y, s->z, s->rx, s->ry, g->fov, g->ortho, g->render_radius);
//     float planes[6][4];
//     frustum_planes(planes, g->render_radius, matrix);
    attrib.program.Use()

	attrib.matrix.UniformMatrix4fv(false, matrix)
    attrib.camera.Uniform3f(x, y, z)
    attrib.sampler.Uniform1i(0)
    attrib.extra1.Uniform1i(2)
    attrib.extra2.Uniform1f(light)
//     attrib.extra3.Uniform1f(g->render_radius * CHUNK_SIZE);
    attrib.extra3.Uniform1f(256);
    attrib.extra4.Uniform1i(ortho);
    attrib.timer.Uniform1f(time);
}

func draw_triangles_3d_ao(attrib *BlockProgram, buffer gl.Buffer, count int) {
    buffer.Bind(gl.ARRAY_BUFFER)

	attrib.position.EnableArray()
	attrib.normal.EnableArray()
	attrib.uv.EnableArray()

	flt32Size := 4
	attrib.position.AttribPointer(3, gl.FLOAT, false, flt32Size*10, 0)
	attrib.normal.AttribPointer(3, gl.FLOAT, false, flt32Size*10, flt32Size*3)
	attrib.uv.AttribPointer(4, gl.FLOAT, false, flt32Size*10, flt32Size*6)

//     glVertexAttribPointer(attrib->position, 3, GL_FLOAT, GL_FALSE,
//         sizeof(GLfloat) * 10, 0);
//     glVertexAttribPointer(attrib->normal, 3, GL_FLOAT, GL_FALSE,
//         sizeof(GLfloat) * 10, (GLvoid *)(sizeof(GLfloat) * 3));
//     glVertexAttribPointer(attrib->uv, 4, GL_FLOAT, GL_FALSE,
//         sizeof(GLfloat) * 10, (GLvoid *)(sizeof(GLfloat) * 6));

	gl.DrawArrays(gl.TRIANGLES, 0, count)

	attrib.position.DisableArray()
	attrib.normal.DisableArray()
	attrib.uv.DisableArray()

	buffer.Unbind(gl.ARRAY_BUFFER);
}

type Chunk struct {
	buffer gl.Buffer
	faces int
}
func draw_chunk(attrib *BlockProgram, chunk *Chunk) {
    draw_triangles_3d_ao(attrib, chunk.buffer, chunk.faces * 6);
}
