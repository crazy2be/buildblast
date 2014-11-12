define(function(require){

var Body = require("physics/body");
var EntityState = require("entities/model/entityState");
var Health = require("entities/model/health");
var BioticState = require("entities/model/bioticState");
var WorldItemState = require("entities/model/worldItemState");

var Protocol = {};

Protocol.parseBody = function(proto) {
	return new Body(
		threeVecFromProto(proto.Pos),
		threeVecFromProto(proto.Vel),
		threeVecFromProto(proto.Dir),
		threeVecFromProto(proto.HalfExtents),
		threeVecFromProto(proto.CenterOffset)
	)
};

Protocol.parseEntityState = function(proto) {
	return new EntityState(proto.EntityId, Protocol.parseBody(proto.Body), proto.LastUpdated);
};

Protocol.parseHealth = function(proto) {
	return new Health(proto.Life);
};

Protocol.parseBioticState = function(proto) {
	return new BioticState(Protocol.parseEntityState(proto.EntityState),
			Protocol.parseHealth(proto.Health));
};

Protocol.parseWorldItemState = function(proto) {
	return new WorldItemState(Protocol.parseEntityState(proto.EntityState), proto.ItemKind);
};

function threeVecFromProto(proto) {
	return new THREE.Vector3(proto.X || 0, proto.Y || 0, proto.Z || 0);
}

return Protocol;

});
