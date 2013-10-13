//Not really needed, just somewhere to put the interface
define(function (require) {
	function UIViewBase() {
		var self = this;
		self.inited = false;

		//We probably lose some speed with this,
		//but it makes the context sensible.
		self.meshes = self.meshes.bind(this);
		self.update = self.update.bind(this);
		self.init = self.init.bind(this);
	}
	UIViewBase.prototype.meshes = function () {
		return [];
	}
	UIViewBase.prototype.update = function (entity, clock, viewFacingPos) {
		if (!this.inited) {
			this.inited = true;
			this.init();
		}
	}
	//Called (by the base update implementation) on the first update call.
	UIViewBase.prototype.init = function (entity) {
	}
	UIViewBase.prototype.fixToPlayer = function () {
		return true;
	}
	return UIViewBase;
});