Coordinate Systems
----------------------------
We use two main coordinates systems in the code:
- **wc**: World coordinates. Used for positions of entities, physics calculations, and everything that isn't blocks.
- **bc**: Block coordinates. Same as world coordinates, but always integers. Useful for dealing with blocks. On the JavaScript side, this distinction isn't as pronounced, most things just floor the world coordinates they are given.

In map generation and geometry code, which is particularly concerned with the existence of chunks, you may also see the following coordinate systems used:
- **cc**: Chunk coordinates. Essentially `floor(bc / 32)`. Gives the coordinate of a chunk, relative to other chunks. Multiply by 32 to get the position of the chunk in 3d space.
- **oc**: Offset coordinates. Like block coordinates, but refer to a block at a specified offset *within* a chunk, rather than just within the world. Used mostly just in map generation and geometry code. All components should be in the range [0...31].
- **pc**: Plane coordinates. Like offset coordinates, but have a rotated frame of reference. This allows the code which creates different faces to be the same. In this model z is perpendicular to the face. compX, compY, etc refer to the mapping from pc to bc (compX = 1, means pcX represents bc