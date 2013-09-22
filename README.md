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
	
	
Development
-----------
Make a branch, develop your feature/bugfix, and send a pull request. A couple tips:
- **Read your diffs**. We all change things casually when learning a system, and poke at various things, but you should revert these changes before committing (or stash them somewhere), to ensure your pull request is focused on one particular thing that needs changing, and to reduce the time it takes to review.
- **Keep pull requests small and incremental**. If you want a really big, awesome feature, develop it one piece at a time, so that each of them can be evaluated individually, and so that we can all discuss how we want the feature to look *before* you've built the whole thing. This also allows other to build other awesome things you haven't though of yet from your pieces, and reduces the pain of merging to master (which is very quickly changing at this point).
- **Format your code**.
	- Things are a little looser on the JS side, but try to match the existing code. Always use tabs. Use semicolons. Braces on the same line. I'm sure you can figure it out :).
	- On the go side, always run `go fmt buildblast/...` before submitting a pull request.

Coordinate Systems
----------------------------
We use two main coordinates systems in the code:
- **wc**: World coordinates. Used for positions of entities, physics calculations, and everything that isn't blocks.
- **bc**: Block coordinates. Same as world coordinates, but always integers. Useful for dealing with blocks. On the JavaScript side, this distinction isn't as pronounced, most things just floor the world coordinates they are given.

In map generation and geometry code, which is particularly concerned with the existence of chunks, you may also see the following coordinate systems used:
- **cc**: Chunk coordinates. Essentially `floor(bc / 32)`. Gives the coordinate of a chunk, relative to other chunks. Multiply by 32 to get the position of the chunk in 3d space.
- **oc**: Offset coordinates. Like block coordinates, but refer to a block at a specified offset *within* a chunk, rather than just within the world. Used mostly just in map generation and geometry code. All components should be in the range [0...31].
- **pc**: Plane coordinates. Like offset coordinates, but have a rotated frame of reference. This allows the code which creates different faces to be the same. In this model z is perpendicular to the face. compX, compY, etc refer to the mapping from pc to bc (compX = 1, means pcX represents bcY)

Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.

Or checkout the bug list (for bugs or features, whichever suits your fancy).
