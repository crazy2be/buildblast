define(function () {
return function EntityState(pos, look, health, vy) {
	this.pos = pos || new THREE.Vector3(0, 0, 0);
	this.look = look || new THREE.Vector3(0, 0, 0);
	this.health = health || 100;
	this.vy = vy || 0.0;
	this.clone = function () {
		var cloned = new EntityState(
			this.pos.clone(),
			this.look.clone(),
			this.health,
			this.vy);
		return cloned;
	};
	this.lerp = function (other, frac) {
		this.pos.lerp(other.pos, frac);
		this.look.lerp(other.look, frac);
		this.health = this.health*(1 - frac) + other.health*frac;
		this.vy = this.vy*(1 - frac) + other.vy*frac;
		return this;
	};
	function close(a, b) {
		return Math.abs(a - b) < 0.0001;
	}
	this.prettyCloseTo = function (other) {
		return close(this.pos.x, other.pos.x) &&
			close(this.pos.y, other.pos.y) &&
			close(this.pos.z, other.pos.z) &&
			close(this.look.x, other.look.x) &&
			close(this.look.y, other.look.y) &&
			close(this.look.z, other.look.z) &&
			close(this.health, other.health) &&
			close(this.vy, other.vy);
	};
}
});
