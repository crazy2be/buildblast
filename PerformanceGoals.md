Player Movement
---------------
Player presses controls -> Player's character/view moves

1. Speed
2. Accuracy
3. Smoothness

(Move > Correct > Smooth)

Speed is the most important for the player, they will "feel" any lag and it will directly correspond to their gaming experience. Ex, Source engine games feel extremely snappy, and FPSes also feel as if there is almost 0 delay between pressing a button and seeing your player move. A constant delay is important too, but hopefully the delay should be so minor they won't notice if occasionally the game takes 20 milliseconds to respond instead of 10, as it is so incredibly fast anyway.

Accuracy is more important than smoothness. This means if the user moves to a place, but the server rejects the movement, it is more important to almost immediately more the player back than slowly interpolate their movement. Some interpolation may be useful, but any time they think they are in a position which the server does not agree with, their actions will not work properly and they have a greater chance of making incorrect movement (accidently walking off a cliff because the UI shows they are farther away from it than they are).

### Tests

- Speed
	1. Simulate controls
	2. Wait until entity receives movement
	3. Wait until new position is drawn
- Accuracy
	1. Simulate controls to cause invalid movement
	2. Bypass screening of invalid movement
	3. (Observe how long it takes for this to be drawn?)
	4. Wait until server corrects movement
	5. Wait until correct position is drawn

Non Player Movement
-------------------
Player on other computer presses a button -> Their entity moves

1. Accuracy
2. Smoothness
3. Speed*

(Correct > Smooth > Move)

"Accuracy" is the most important here. In reality we will put entities in positions in the past, and then furthermore, the server will compensate for this PLUS the delay in sending the commands to the server when it is calculating if we hit anything. The result is if you shoot someone on your client, it should actually shoot them. This means by accuracy I mean client side accuracy, the position of entities on your machine is actually going to be "pretty far" (like 150 milliseconds?) off.

Smoothness is important for a similar reason to accuracy, if an enemy player is jumping around the map because the server keeps changing its mind about the entities position it will be almost impossible to shoot that player. So instead it is best to smooth the entity's movement (and have the server accept or control this in a manner, so accuracy is preserved).

Speed is theoretically important (it would be nice if when you jump or turn around other people see immediately), but in reality people won't really notice if there is a delay, if it is under 1 second they will never really be able to prove their is a delay if we mask it with lag compensation, so this has the least priority. However, if we do send and process commands faster it will automatically make everything more accurate and smoother...

### Tests

- Accuracy shooting
	1. Simulate a lot (probably from a pattern) of movement for other user?
	2. Try to shoot at other user (based on local position data)
	3. Observe tolerance for accuracy of shots and amount of hits.
- Speed
	1. Simulate controls for other user?
	2. Wait until other entity's movement is received
	3. Wait until it draws

World Responsiveness
--------------------
Player mines a block -> They see the block be remove / Other people see the block removed / Other people fall in the hole made by the absence of the block

1. Player sees their actions
2. Player can interact with the world
3. Other players see their actions
4. Other players can interact with the world

1. Some sort of logic to speed up application of players actions may be beneficial, as a lot of the time players will not be interacting (walking into) blocks as they change them, we can probably get away with a lot of fudging here.
2. If actions are generally applied visually faster we can probably allow the player to interact with the world faster too. If their block placements were rejected their movement will likely be rewound anyway (due to PlayerPrediction). It is not likely for this to have negative consequences, if they are removing blocks and walking forward they will just be moved backwards. If they are placing blocks and walking on them, it is highly unlikely for their placements to be rejected, but if they are they may fall down?
3. We do want other players so see their actions fairly fast though too, that way if 2 people are building something together they are not constantly overlapping their actions.
3. Same as 2, except if people are working together, not really significant as by the time the messages get to other players they will be applied on the server.

### Tests
- Speed
	1. Place/remove block(s)
	2. Wait until data it received
	3. Wait until changes are drawn
- Speed for other (same, but place/remove block(s) on other user)

Refs
----
- https://developer.valvesoftware.com/wiki/Lag_compensation
- https://developer.valvesoftware.com/wiki/Source_Multiplayer_Networking