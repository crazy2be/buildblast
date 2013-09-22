Chunks
=======

(See worldReadme.md also.)

Rendering
----------------------------
We use THREE.js (http://en.wikipedia.org/wiki/Threejs) to do our rendering, which uses WebGL.

Our render call looks like `renderer.render(scene, camera);` where:

- Renderer is a THREE.WebGLRenderer which owns rendered.domElement which is placed in the DOM.
- Scene is a THREE.Scene which is populated with everything which needs to be drawn.
- Camera is a THREE.PerspectiveCamera, or any Camera type.

Scene Population
------------------
- Scene is populated by calling add on a THREE.Mesh(geometry, CHUNK_MATERIAL).
- THREE.Mesh is created with a geometry and a THREE.MeshBasicMaterial (or any Material type).
- A geometry is a THREE.BufferGeometry, which just has its attributes and offsets set.
- .offsets is in the form (DON'T FORGET THE ARRAY, IT'S OBJECTS WITHIN AN ARRAY):

```JavaScript
[{
	start: 0,
	count: indexes.length,
	index: 0,
}]
```

This specifies the start, count and amount to add to each index for the indexes within .attributes.

- .attributes is in the form:

```JavaScript
{
	position: { //Each position is composed of 3 numbers, x, y, z.
		itemSize: 3, 
		array: vertsa, //Float32Array
		numItems: vertsa.length / 3
	},
	color: {	//Colors of position (so parallel to position). The vertex 
				//shader interpolates these points to color the faces.
				//Each color is composed of 3 numbers, r, g, b, each between 0 and 1.
		itemSize: 3,
		array: colora, //Float32Array
		numItems: colora.length / 3
	},
	index: {	//Groups of 3. Each index refers to an index within position, and each group of 3 is a triangle.
				//The index of the position is the number in this array * 3, as there are 3 values per point.
				//So if index.array[q] is 10, it refers to position {x: position.array[30], y: position.array[31], z: position.array[32]}
		itemSize: 1,
		array: indexa,
		numItems: indexa.length //Uint16Array
	},
}
```