BuildBlast
======

Experimental, voxel-based, interactive, multiplayer, dynamic, real-time world. Features server side validation and lag compensation.

Try it: **[buildblast.com](http://www.buildblast.com)**

Installation
---------------

	cd $GOPATH/src
	git clone git://github.com/crazy2be/buildblast.git buildblast
	go get buildblast/server

(Note that you will need to [install go](http://golang.org/doc/install) and have a [working GOPATH](http://golang.org/doc/code.html) for this to work.)

To play,

	cd buildblast
	./runserver
	google-chrome http://localhost:8080

Coordinate Systems
----------------------------
We use two main coordinates systems in the code:
- **wc**: World coordinates. Used for positions of entities, physics calculations, and everything that isn't blocks.
- **bc**: Block coordinates. Same as world coordinates, but always integers. Useful for dealing with blocks. On the JavaScript side, this distinction isn't as pronounced, most things just floor the world coordinates they are given.

In map generation and geometry code, which is particularly concerned with the existence of chunks, you may also see the following coordinate systems used:
- **cc**: Chunk coordinates. Essentially `floor(bc / 32)`. Gives the coordinate of a chunk, relative to other chunks. Multiply by 32 to get the position of the chunk in 3d space.
- **oc**: Offset coordinates. Like block coordinates, but refer to a block at a specified offset *within* a chunk, rather than just within the world. Used mostly just in map generation and geometry code. All components should be in the range [0...31].
- **pc**: Plane coordinates. Like offset coordinates, but have a rotated frame of reference. This allows the code which creates different faces to be the same. In this model z is perpendicular to the face. compX, compY, etc refer to the mapping from pc to bc (compX = 1, means pcX represents bcY)

Rendering
----------------------------
We use THREE.js (http://en.wikipedia.org/wiki/Threejs) to do our rendering, which uses WebGL.

Our render call looks like:

```JavaScript
renderer.render(scene, camera);
```

- Renderer is a THREE.WebGLRenderer which owns rendered.domElement which is placed in the DOM.
- Scene is a THREE.Scene which is populated with everything which needs to be drawn.
- Camera is a THREE.PerspectiveCamera, or any Camera type.

Scene Population
------------------
- Scene is populated by calling add on a THREE.Mesh.
- Three.Mesh is created with a geometry and a THREE.MeshBasicMaterial (or any Material type).
- A geometry is simple an object with a .offsets and .attributes.
- .offsets is in the form:

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
[{
	position: { //Each position is composed of 3 numbers, x, y, z.
		itemSize: 3, 
		array: vertsa,
		numItems: vertsa.length / 3
	},
	color: {	//Colors of position (so parallel to position). The vertex 
				//shader interpolates these points to color the faces.
		itemSize: 3,
		array: colora,
		numItems: colora.length / 3
	},
	index: { //Groups of 3. Each index refers to an index within position, and each group of 3 is a triangle.
		itemSize: 1,
		array: indexa,
		numItems: indexa.length
	},
}]
```


Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.
- Make a more efficient mesher that doesn't result in visual artifacts (a naïve [greedy mesher](http://0fps.wordpress.com/2012/07/07/meshing-minecraft-part-2/) seems to produce artifacts on cheaper cards. Might be avoidable somehow.)
