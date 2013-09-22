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

Architecture (client side)
---------------
The architecture is based on a few fairly simple structures, which communicate through a few objects (similar to http://yuml.me/d5f4fb7b). Specifically:
- **container**: Just a div in the html, we use this to hook up the actual rendering. There are some hardcoded elements in this, which we hook up to to give THREE.js a place to render (amoung other things).
- **Conn**: A wrapper for a WebSocket, used to communicate to the server.
- **Scene**: A THREE.Scene, this holds all the meshes and models which THREE.js will render.
- **ChunkManager**: Manages the chunks (of blocks), and handles adding and removing them from the THREE.Scene.
- **EntityManager**: Manages the entities (players for now, in the future hopefully more) and add/removes them from the THREE.Scene.
- **World**: Holds both the ChunkManager and EntityManager and provides useful logic to interface with them. Can directly expose blocks but also provides most of the helper functions you should need.
- **Player**: Should probably be called _UserInterface_. Handles displaying the interface elements and rendering the scene. Shouldn't hold any game data, or be required for the game to run.

Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.
- Make a more efficient mesher that doesn't result in visual artifacts (a naïve [greedy mesher](http://0fps.wordpress.com/2012/07/07/meshing-minecraft-part-2/) seems to produce artifacts on cheaper cards. Might be avoidable somehow.)
