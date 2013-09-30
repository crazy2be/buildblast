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

Architecture (client side)
---------------
The architecture is based on a few fairly simple structures, which communicate through a few objects (similar to http://yuml.me/d5f4fb7b). Specifically:
- **container**: Just a div in the html, we use this to hook up the actual rendering. There are some hardcoded elements in this, which we hook up to to give THREE.js a place to render (amoung other things).
- **Conn**: A wrapper for a WebSocket, used to communicate to the server.
- **Scene**: A THREE.Scene, this holds all the meshes and models which THREE.js will render.
- **ChunkManager**: Manages the chunks (of blocks), and handles adding and removing them from the THREE.Scene.
- **EntityManager**: Manages the entities (players for now, in the future hopefully more) and add/removes them from the THREE.Scene.
- **World**: Holds both the ChunkManager and EntityManager and provides useful logic to interface with them. Can directly expose blocks but also provides most of the helper functions you should need.
- **PlayerUI**: Handles displaying the interface elements and rendering the scene. Shouldn't hold any game data, or be required for the game to run.

Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.

Or checkout the bug list (for bugs or features, whichever suits your fancy).
