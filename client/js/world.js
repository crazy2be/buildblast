define(function(require) {

	var ChunkManager = require("chunkManager");
	var EntityManager = require("entities/entityManager");

	var common = require("chunks/chunkCommon");
	var colorPicker = require("shared/colorPicker");
	
	var ko = require("knockout");
	
	var debugObjBinding = require("debugObjBinding");
	
	var acceptKoIntegrate = require("koIntegrate/acceptKoIntegrate");
	var ctorObservableMap = require("koIntegrate/ctorObservableMap");

	return function World(scene, conn, clientID, clock) {
		var self = this;

		//Hmm... this really makes testing easier
		window.world = self;

		var chunkManager = new ChunkManager(scene, clientID);
		var entityManager = new EntityManager(scene, conn, self, clock);
		
		self.Teams = ctorObservableMap();
		self.KOTH_CONSTS = { MaxPoints: ko.observable(-1) };
		
		self.hillSphere = ko.observable({});
		self.hillColor = ko.observable("black").extend({notify: 'always'});
		
		//Grumble grumble...
		self.TeamsArray = ko.computed(function() {
			var arr = [];
			var obj = self.Teams();
			for(var key in obj) {
				arr.push(obj[key]);
			}
			return arr;
		})
		
		//self.EntitiesTest = ctorObservableMap();

		ko.applyBindings(self, $("#container")[0])

		self.addUserPlayer = entityManager.addUserPlayer;

		window.testExposure.chunkManager = chunkManager;
		window.testExposure.entityManager = entityManager;

		conn.on('debug-ray', processRay);
		
	    //TODO: Make this an entity
	    //var hillMaterial = new THREE.MeshLambertMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });
		var hillMaterial = new THREE.MeshLambertMaterial({ 
			ambient: 0xff00ff,
			transparent: true, 
			opacity: 0.5,
		});
		hillMaterial.side = THREE.DoubleSide;
		var hillGeom = new THREE.SphereGeometry(1, 50, 50);
		var hillMesh = new THREE.Mesh(hillGeom, hillMaterial);

		scene.add(hillMesh);

		self.hillSphere.subscribe(function(Sphere){
		    var hillCenter = new THREE.Vector3(Sphere.Center.X, Sphere.Center.Y, Sphere.Center.Z);
		    var radius = Sphere.Radius;
    //http://stackoverflow.com/questions/17341297/three-js-change-radius-of-sphere-with-dat-gui
		    hillMesh.scale.set(radius, radius, radius)
		    hillGeom.needsUpdate = true;
		    hillMesh.position = hillCenter;
		});
		
		self.hillColor.subscribe(function(color){
			hillMaterial.ambient.setHex(colorPicker(color, true));
		});
		
		conn.on('obj-prop-set', function(payload) {
			if(!self[payload.ObjectName]) {
				self[payload.ObjectName] = ko.observable({});
			}
			self[payload.ObjectName]()[payload.PropName] = payload.Value;
			self[payload.ObjectName].valueHasMutated();
		})
		
		conn.on('ko-integrate', acceptKoIntegrate.bind(null, world));

		function processRay(payload) {
			var pos = new THREE.Vector3(payload.Pos.X, payload.Pos.Y, payload.Pos.Z);
			self.addSmallCube(pos);
		}

		self.update = function (dt, playerPos) {
			chunkManager.update(dt, playerPos);
			entityManager.update(dt, playerPos);
		};

		var smallCube = new THREE.CubeGeometry(0.1, 0.1, 0.1);
		var smallCubeMat = new THREE.MeshNormalMaterial();
		self.addSmallCube = function (position) {
			if (!position) throw "Position required!";
			var cube = new THREE.Mesh( smallCube, smallCubeMat );
			cube.position = position;
			scene.add(cube);
		};

		self.addToScene = function (mesh) {
			scene.add(mesh);
		};

		self.removeFromScene = function (mesh) {
			scene.remove(mesh);
		};

		self.blockAt = function (wcX, wcY, wcZ) {
			var cords = common.worldToChunk(wcX, wcY, wcZ);
			var oc = cords.o;
			var cc = cords.c;

			var chunk = chunkManager.chunk(cc);
			if (!chunk) return null;
			var block = chunk.block(oc);
			if (!block) throw "Could not load blockkk!!!";
			else return block;
		};

		function findIntersection(point, look, criteriaFnc, precision, maxDist) {
			precision = precision || 0.01;
			maxDist = maxDist || 100;

			point = point.clone();

			look = look.clone();
			look.setLength(precision);

			for (var dist = 0; dist < maxDist; dist += precision) {
				point.add(look);
				var collision = criteriaFnc(point.x, point.y, point.z);
				if (collision) {
					return {
						point: point,
						dist: dist,
						item: collision,
					};
				}
			}
		}

		self.findPlayerIntersection = function (camera, precision) {
			function entityAt(wcX, wcY, wcZ) {
				return entityManager.entityAt(wcX, wcY, wcZ);
			}
			return findIntersection(camera.position, getLookedAtDirection(camera), entityAt, precision);
		};

		var projector = new THREE.Projector();
		function getLookedAtDirection(camera) {
			var look = new THREE.Vector3(0, 0, 1);
			// http://myweb.lmu.edu/dondi/share/cg/unproject-explained.pdf
			projector.unprojectVector(look, camera);
			return look.sub(camera.position);
		}

		// Traces a vector from the camera's position, along the look vector,
		// until hitting a solid block. If dontWantSolidBlock is true, it then
		// backs up one step, until the block immediately before the solid
		// block. Returns the position of the block.
		// BUG(yeerkkiller1): (literal) corner case is not handled correctly: 
		// http://awwapp.com/s/e3/4f/fe.png
		self.findLookedAtBlock = function(camera, dontWantSolidBlock) {
			var precision = 0.1;
			var pos = camera.position;
			var dir = getLookedAtDirection(camera);

			function solidBlockAt(wcX, wcY, wcZ) {
				var block = self.blockAt(wcX, wcY, wcZ);
				return block && block.solid();
			}
		
			var intersect = findIntersection(pos, dir, solidBlockAt, precision);
			if (!intersect) {
				console.log("You aren't looking at anything!");
				return;
			}

			if (dontWantSolidBlock) {
				//We backup to the last point, so should be the block directly before a solid.
				var cameraDirection = dir.setLength(precision);
				intersect.point.sub(cameraDirection);
			}

			return intersect.point;
		};

		self.changeBlock = function(wcX, wcY, wcZ, newType) {
			conn.queue('block', {
				Pos: {
					X: Math.floor(wcX),
					Y: Math.floor(wcY),
					Z: Math.floor(wcZ),
				},
				Type: newType,
			});
			chunkManager.queueBlockChange(wcX, wcY, wcZ, newType);
		}
	}
});