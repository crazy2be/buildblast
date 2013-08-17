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

Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.
- Make a more efficient mesher that doesn't result in visual artifacts (a naïve [greedy mesher](http://0fps.wordpress.com/2012/07/07/meshing-minecraft-part-2/) seems to produce artifacts on cheaper cards. Might be avoidable somehow.)
