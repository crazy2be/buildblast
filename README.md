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
- **PlayerUI**: Handles displaying the interface elements and rendering the scene. Shouldn't hold any game data, or be required for the game to run.

Coordinate Systems
----------------------------
We use two main coordinates systems in the code:
- **wc**: World coordinates. Used for positions of entities, physics calculations, and everything that isn't blocks.
- **bc**: Block coordinates. Same as world coordinates, but always integers. Useful for dealing with blocks. On the JavaScript side, this distinction isn't as pronounced, most things just floor the world coordinates they are given.

In map generation and geometry code, which is particularly concerned with the existence of chunks, you may also see the following coordinate systems used:
- **cc**: Chunk coordinates. Essentially `floor(bc / 32)`. Gives the coordinate of a chunk, relative to other chunks. Multiply by 32 to get the position of the chunk in 3d space.
- **oc**: Offset coordinates. Like block coordinates, but refer to a block at a specified offset *within* a chunk, rather than just within the world. Used mostly just in map generation and geometry code. All components should be in the range [0...31].
- **pc**: Plane coordinates. Like offset coordinates, but have a rotated frame of reference. This allows the code which creates different faces to be the same. In this model z is perpendicular to the face. compX, compY, etc refer to the mapping from pc to bc (compX = 1, means pcX represents bc

Lag hiding
----------
In order to make the game playable with 100s of milliseconds of lag we apply multiple algorithms to reduce the appearance of lag. You might find [this article by Valve](https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking) to be helpful if you are interested in this.

### Lag Compensation (Shooting is accurate regardless of lag)
If the client shoots at time 0 ms, and the server receives it at time 100 ms, it is likely the person they were shooting at has moved since the time they shot. So, we "lag compensate" players (entities). This means the server stores the history of positions for every player, and the player timestamps its shoot events, so when the server receives the shoot it can simulate it with the player positions that existed when the shot was fired.

 - https://developer.valvesoftware.com/wiki/Lag_compensation
 - http://en.wikipedia.org/wiki/Lag_(online_gaming)#Rewind_time

### Input Prediction (No player movement lag)
When the player presses a movement key technically we need to wait until the server confirms the message to know if we can move, since the server is the "master". However, it's much nicer from a user's perspecitve if the controls respond immediately. Thus, we use the client's game state to make predictions about what will happen, and show that state to the player. If the server thinks something different happened, we'll throw away our predictions, and follow it's command.

 - https://developer.valvesoftware.com/wiki/Prediction

### Lag Induction (Smooth other player movement and easier gameplay)
The server may send messages at a varying speed, and we may receive them at a varying speed. This means other player's will appear to jerk around as we receive movement messages. To get around this we store don't immediately show player positions as we receive them, instead we show players where they were `lagInduction` time in the past. This gives us a buffer to hide the impact of lag (and smooth out movement). `clock.entityTime()` is the current time that entities are being displayed at.

 - https://developer.valvesoftware.com/wiki/Interpolation

Bugs
-------
If you find any bugs, please report them in the issue tracker with your hardware specs, screenshot, and steps taken to trigger the issue.

Firefox is not supported pending [#504553](https://bugzilla.mozilla.org/show_bug.cgi?id=504553).

Experiments
-----------------
If you want to try out something hard, and possibly impossible, attempt one of these:
- Change the network protocol to have unreliable delivery semantics for certain types of packets, namely player-position and entity-position packets (which are sent a LOT). WebRTC might help here.
- Make a more efficient mesher that doesn't result in visual artifacts (a naïve [greedy mesher](http://0fps.wordpress.com/2012/07/07/meshing-minecraft-part-2/) seems to produce artifacts on cheaper cards. Might be avoidable somehow.)
