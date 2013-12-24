define(function (require) {

var THREE = require("THREE");
var PLAYER = require("player/playerSize");
var EntityState = require("./entityState");
var PlayerMesh = require("./UIViews/playerMesh");
var EntityBar = require("./UIViews/entityBar");
var Entity = require("./entity");

return function PlayerEntity(id) {
	var entity = new Entity(id, PLAYER.HALF_EXTENTS, PLAYER.CENTER_OFFSET);
	entity.add(new PlayerMesh());
	return entity;
}
});
