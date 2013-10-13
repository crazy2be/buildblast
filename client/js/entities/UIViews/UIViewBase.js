//Not really needed, just somewhere to put the interface
define(function (require) {
	function UIViewBase() {
		var self = this;
		self.inited = false;
	}
	UIViewBase.prototype.meshes = function () {
		return [];
	}
	UIViewBase.prototype.update = function (entity, clock, viewFacingPos) {
		if (!this.inited) {
			this.inited = true;
			this.init(entity);
		}
	}
	//Called (by the base update implementation) on the first update call.
	UIViewBase.prototype.init = function (entity) {
	}
	//If it returns true, the meshes are added to the entity mesh, so
	//	they track the players movement and rotation (this is likely much more
	//	efficient than manually setting the position). Otherwise the meshes
	//	are added independently to the scene.
	UIViewBase.prototype.fixToPlayer = function () {
		return true;
	}
	return UIViewBase;
});