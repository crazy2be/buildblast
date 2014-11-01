define(function(){

/**
  * @param life type=int
  */
return function Health(life) {
	var self = this;

	self.life = life || 100;

	self.clone = function() {
		return new Health(self.life);
	};

	self.lerp = function(other, frac) {
		self.life = self.life*(1 - frac) + other.life*frac;
	};
}

});