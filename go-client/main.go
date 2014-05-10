// Copyright 2012 The go-gl Authors. All rights reserved.
// Use of this source code is governed by a BSD-style
// license that can be found in the LICENSE file.

package main

import (
	"errors"
	"fmt"
	"github.com/go-gl/gl"
	glfw "github.com/go-gl/glfw3"
	"image"
	"image/png"
	"io"
	"os"
	"log"
	"io/ioutil"
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

	window, err := glfw.CreateWindow(Width, Height, Title, nil, nil)
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

func createTexture(r io.Reader) (gl.Texture, error) {
	img, err := png.Decode(r)
	if err != nil {
		return gl.Texture(0), err
	}

	rgbaImg, ok := img.(*image.NRGBA)
	if !ok {
		return gl.Texture(0), errors.New("texture must be an NRGBA image")
	}

	textureId := gl.GenTexture()
	textureId.Bind(gl.TEXTURE_2D)
	gl.TexParameterf(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST)
	gl.TexParameterf(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST)

	// flip image: first pixel is lower left corner
	imgWidth, imgHeight := img.Bounds().Dx(), img.Bounds().Dy()
	data := make([]byte, imgWidth*imgHeight*4)
	lineLen := imgWidth * 4
	dest := len(data) - lineLen
	for src := 0; src < len(rgbaImg.Pix); src += rgbaImg.Stride {
		copy(data[dest:dest+lineLen], rgbaImg.Pix[src:src+rgbaImg.Stride])
		dest -= lineLen
	}
	gl.TexImage2D(gl.TEXTURE_2D, 0, 4, imgWidth, imgHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, data)

	return textureId, nil
}

type BlockProgram struct {
	program  gl.Program
	position gl.AttribLocation
	normal   gl.AttribLocation
	uv       gl.AttribLocation
	matrix   gl.UniformLocation
	sampler  gl.UniformLocation
	extra1   gl.UniformLocation
	extra2   gl.UniformLocation
	extra3   gl.UniformLocation
	extra4   gl.UniformLocation
	camera   gl.UniformLocation
	timer    gl.UniformLocation
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

	gl.Lightfv(gl.LIGHT0, gl.AMBIENT, ambient)
	gl.Lightfv(gl.LIGHT0, gl.DIFFUSE, diffuse)
	gl.Lightfv(gl.LIGHT0, gl.POSITION, lightpos)
	gl.Enable(gl.LIGHT0)

	gl.Viewport(0, 0, Width, Height)
	gl.MatrixMode(gl.PROJECTION)
	gl.LoadIdentity()
	gl.Frustum(-1, 1, -1, 1, 1.0, 10.0)
	gl.MatrixMode(gl.MODELVIEW)
	gl.LoadIdentity()

	goph, err := os.Open("../client/img/block_textures/atlas.png")
	if err != nil {
		panic(err)
	}
	defer goph.Close()

	texture, err = createTexture(goph)

	// Create programs
	program := load_program(
        "shaders/block_vertex.glsl", "shaders/block_fragment.glsl");
    block_attrib.program = program;
    block_attrib.position = program.GetAttribLocation("position");
    block_attrib.normal = program.GetAttribLocation("normal");
    block_attrib.uv = program.GetAttribLocation("uv");
    block_attrib.matrix = program.GetUniformLocation("matrix");
    block_attrib.sampler = program.GetUniformLocation("sampler");
    block_attrib.extra1 = program.GetUniformLocation("sky_sampler");
    block_attrib.extra2 = program.GetUniformLocation("daylight");
    block_attrib.extra3 = program.GetUniformLocation("fog_distance");
    block_attrib.extra4 = program.GetUniformLocation("ortho");
    block_attrib.camera = program.GetUniformLocation("camera");
    block_attrib.timer = program.GetUniformLocation("timer");

	return
}

func make_shader(type_ gl.GLenum, source []byte) gl.Shader {
    shader := gl.CreateShader(type_)
    shader.Source(string(source))
    shader.Compile()
//     GLint status;
	status := shader.Get(gl.COMPILE_STATUS)
//     glGetShaderiv(shader, GL_COMPILE_STATUS, &status);
    if (status == gl.FALSE) {
//         GLint length;
//         glGetShaderiv(shader, GL_INFO_LOG_LENGTH, &length);
//         GLchar *info = calloc(length, sizeof(GLchar));
//         glGetShaderInfoLog(shader, length, NULL, info);
//         fprintf(stderr, "glCompileShader failed:\n%s\n", info);
//         free(info);
		log.Fatal("Error compiling shader! ", shader.GetInfoLog())
    }
    return shader;
}

func load_shader(type_ gl.GLenum, path string) gl.Shader {
    data, err := ioutil.ReadFile(path)
	if err != nil {panic(err)}
    return make_shader(type_, data)
}

func make_program(shader1 gl.Shader, shader2 gl.Shader) gl.Program {
    program := gl.CreateProgram()
    program.AttachShader(shader1)
    program.AttachShader(shader2)
	program.Link()
//     glLinkProgram(program);
//     GLint status;
//     glGetProgramiv(program, GL_LINK_STATUS, &status);
	status := program.Get(gl.LINK_STATUS)
    if (status == gl.FALSE) {
		log.Fatal("Error linking program! ", program.GetInfoLog())
//         GLint length;
//         glGetProgramiv(program, GL_INFO_LOG_LENGTH, &length);
//         GLchar *info = calloc(length, sizeof(GLchar));
//         glGetProgramInfoLog(program, length, NULL, info);
//         fprintf(stderr, "glLinkProgram failed: %s\n", info);
//         free(info);
    }
    // ???? Why detach the shaders?
//     glDetachShader(program, shader1);
//     glDetachShader(program, shader2);
//     glDeleteShader(shader1);
//     glDeleteShader(shader2);
    return program;
}

func load_program(path1, path2 string) gl.Program {
    shader1 := load_shader(gl.VERTEX_SHADER, path1);
    shader2 := load_shader(gl.FRAGMENT_SHADER, path2);
    program := make_program(shader1, shader2);
    return program;
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
}
