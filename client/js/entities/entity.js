define(function(require) {

	var THREE = require("THREE");

	var PosPrediction = require("entities/lagCompensation/posPrediction");

	var PLAYER = require("player/playerSize");

	var PosHistoryBar = require("entities/entityViews/PosHistoryBar");
	
	var EntityMainMesh = require("entities/entityViews/EntityMainMesh");

	return function Entity(id, world, clock, scene) {
		var self = this;

		var rot = new THREE.Vector3(0, 0, 0);
		var hp = 0;

		var posPrediction = new PosPrediction(world, clock, {
				pos: new THREE.Vector3(0, 0, 0),
				dy: 0,
				look: new THREE.Vector3(0, 0, 0),
			});

		var _isLagInduced = true;
		posPrediction.lagInduce(_isLagInduced);

		self.posDebugData = posPrediction.posDebugData;

		//We forward a lot, as we are basically embedding posPrediction
		self.predictMovement = posPrediction.predictMovement;
		self.posMessage = posPrediction.posMessage;
		self.pos = function() {
			return posPrediction.posState().pos;
		};
		self.look = function() {
			return posPrediction.posState().look;
		};
		self.dy = function() {
			return posPrediction.posState().dy;
		};
		self.posState = posPrediction.posState;
		
		self.getVelocity = posPrediction.getVelocity;
	
		self.contains = posPrediction.contains;
		self.lag = posPrediction.lag;

		var UIViews = [];

		self.initViews = function() {
			if (localStorage.posHistoryBar) {
				UIViews.push(new PosHistoryBar(self, posPrediction, clock));
			}
			
			UIViews.push(new EntityMainMesh(self));

			return self;
		};

		self.lagInduce = function(yes) {
			_isLagInduced = yes;
			posPrediction.lagInduce(_isLagInduced);
		}
		self.isLagInduced = function() {
			return _isLagInduced;
		}
	
		self.setViewVisibility = function(visible) {
			if(!visible) {
				self.removeFromScene();
			} else {
				self.addToScene();
			}
		}

		self.setHealth = function(health) {
			hp = health;
		};

		self.health = function() {
			return hp;
		};

		self.maxHealth = function() {
			//QTODO: Actually sync this with the server
			return 100;
		}

		self.addToScene = function () {
			UIViews.forEach(function (view) {
				scene.add(view.mesh());
			});
		};

		self.removeFromScene = function () {
			UIViews.forEach(function (view) {
				scene.remove(view.mesh());
			});
		};

		self.id = function () {
			return id;
		};

		self.update = function(dt, playerPos) {
			UIViews.forEach(function (view) {
				view.update(dt, playerPos);
			});
		};
	}
});