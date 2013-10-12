define(function () {
	return function EntityState(pos, look, health, vy) {
		this.pos = pos || new THREE.Vector3(0, 0, 0);
		this.look = look || new THREE.Vector3(0, 0, 0);
		this.health = health || 100;
		this.maxHealth = 100; //TODO, sync this with the server.
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
			this.health = this.health * (1 - frac) + other.health * frac;
			this.vy = this.vy * (1 - frac) + other.vy * frac;
			return this;
		}
	}
});
