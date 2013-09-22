Lag hiding
==================

In order to make the game playable with 100s of milliseconds of lag we apply multiple algorithms to reduce the appearance of lag.

Lag Compensation (Shooting is accurate regardless of lag)
-------------------
(https://developer.valvesoftware.com/wiki/Lag_compensation)
(http://en.wikipedia.org/wiki/Lag_(online_gaming)#Rewind_time)
If the client shoots at time 0 ms, and the server receives it at time 100 ms, it is likely the person they were shooting at has moved since the time they shot. So, we "lag compensate" players (entities). This means the server stores the history of positions for every player, and the player timestamps its shoot events, so when the server receives the shoot it can simulate it with the player positions that existed when the shot was fired.

Input Prediction (No player movement lag)
---------------------
When the player presses a movement key technically we need to wait until the server confirms the message to know if we can move. However with the current game state we can make predictions about if the movement will be reject or accepted. If we predict it will be accepted, we can move the player, and just confirm the movement when the server sends us back a confirmation (or revert the movement if it was not accepted).

Lag Induction (Smooth other player movement and easier gameplay)
-----------------------
The server may send messages at a varying speed, and we may receive them at a varying speed. This means other player's will appear to jerk around as we receive movement messages. To get around this we store don't immediately show player positions as we receive them, instead we show player positions a certain amount of time in the past. This gives us a buffer to hide the impact of lag, AND makes the game easier (which could be exploited, but for now it can be thought of a benefit).

Structure
---------------
We apply these concepts in a very simple manner. Primarily through creating a position history which stores positions (and sometimes extra data) in the past for all entities (on both the server and client).

The server implements this in just one class (as it doesn't need to confirm positions), the client implements this with a few classes. The client uses: HistoryBuffer which fufills the same interface as the server code does, ContextBuffer which allows storage of extra data and PosPrediction which glues the player geometry and collision together to allow the prediction code to work.

In order to simplify the lag induction we consider the world to have 2 times, clock.time() (the server time), and clock.entityTime() (the time which we use to position the entities at).