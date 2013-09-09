function Inventory(world, camera, conn, controls) {
	var self = this;
	var BAG_SIZE = 25;
	
	// Including left/right quick inventories.
	var NUM_SLOTS = BAG_SIZE + 4; 
	
	var slots = [];

	var leftIsPrimary = true;
	var rightIsPrimary = true;

	function getEquippedSlot(isLeft, isPrimary) {
		index = BAG_SIZE;
		if (!isLeft) index += 2;
		if (!isPrimary) index += 1;
		return index;
	}

	function leftStack() {
		return slots.length > 0 ? slots[getEquippedSlot(true, leftIsPrimary)] : {};
	}

	function rightStack() {
		return slots.length > 0 ? slots[getEquippedSlot(false, rightIsPrimary)] : {};
	}

	var bagIsShowing = false;

	bagHtmlInit();
	updateHtmlEquipChanged(true);
	updateHtmlEquipChanged(false);

	conn.on('inventory-state', function (payload) {
		var items = new Uint8Array(payload.Items.length);
		for (var i = 0; i < items.length; i++) {
			items[i] = payload.Items.charCodeAt(i) - 32;
		}

		var oldLeft = leftStack();
		var oldRight = rightStack();

		slots = [];
		for (var i = 0; i < items.length; i += 2) {
			// Data is packed as NUM_SLOTS*(itemID, itemStackSize) tuples.
			slots[i / 2] = new Stack(new Item(items[i]), items[i + 1]);
		}

		updateEquipped(oldLeft, oldRight);
		updateHtmlItemIcons();
	});

	function bagHtmlInit() {
		var html = "";
		var classList;
		for (var y = 0; y < 5; y++) {
			for (var x = 0; x < 5; x++) {
				classList = "slot";
				if (x !== 0) classList += " has-left-sibling";
				if (y !== 0) classList += " has-top-sibling";
				html += '<div id="bag' + (y*5 + x) + '" class="' + classList + '" index="' + (y*5 + x) + '">'
					+ '<div class="helper"><span class="stack-size"></span></div></div>';
			}
		}
		updateBagVisibility();
		$("#bag").html(html);

		$("#leftPrimary").attr("index", BAG_SIZE);
		$("#leftReserve").attr("index", BAG_SIZE + 1);
		$("#rightPrimary").attr("index", BAG_SIZE + 2);
		$("#rightReserve").attr("index", BAG_SIZE + 3);

		$(".slot").each(function() {
			var index = $(this).attr("index");
			$(this).children("div").draggable({
				helper: "clone",
				appendTo: "body",
				containment: "body",
				scroll: false,
				start: function (event, ui) {
					$(this).attr("index", index);
					ui.helper.css("z-index", 200);
					$(this).css("visibility", "hidden");
				},
				revert: "invalid",
				stop: function(event, ui) {
					if (event.reverted) {
						$(this).css("visibility", "visible");
					}
				}
			});
		});
		$(".slot").droppable({
			drop: function(event, ui) {
				var from = ui.draggable.attr("index");
				var to = $(this).attr("index");

				var fromPosition = ui.draggable.css("background-position");
				var toPosition = $(this).children("div").css("background-position");

				if (from === to || fromPosition === toPosition) {
					ui.draggable.css("visibility", "visible");
					return;
				}

				$(this).children("div").css("background-position", fromPosition);
				ui.draggable.css("background-position", toPosition);

				ui.draggable.css("visibility", "visible");

				var $fromSpan = ui.draggable.children(".stack-size");
				var $toSpan = $(this).children("div").children(".stack-size");
				var fromText = $fromSpan.text();
				$fromSpan.text($toSpan.text());
				$toSpan.text(fromText);

				conn.queue('inventory-move', {
					From: parseInt(from),
					To: parseInt(to),
				});
			},
		});
	}

	function updateHtmlEquipChanged(isLeft) {
		var side = isLeft ? "left" : "right";
		var primaryId = "#" + side + "Primary";
		var reserveId = "#" + side + "Reserve";
		if ((isLeft && leftIsPrimary) || (!isLeft && rightIsPrimary)) {
			$(primaryId).addClass("selected");
			$(reserveId).removeClass("selected");
		} else {
			$(primaryId).removeClass("selected");
			$(reserveId).addClass("selected");
		}
	}

	function updateHtmlItemIcons() {
		for (var i = 0; i < NUM_SLOTS; i++) {
			var stack = slots[i];
			var stackElm = $(".slot[index="+i+"]").children("div");
			updateIcon(stackElm, stack.item.icon());
			updateStackSize(stackElm, stack.item.stackable());
		}
		function updateIcon(stackElm, icon) {
			stackElm.css("background-position", icon*-64 + "px 0");
		}
		function updateStackSize(stackElm, stackable) {
			stackElm.children(".stack-size").text(stackable ? stack.num : "");
		}
	}


	function updateEquipped(oldLeft, oldRight) {
		if (slots.length === 0) return;

		if (oldLeft !== null) {
			leftInventoryModel.setModel(leftStack().model);
		}

		if (oldRight !== null) {
			rightInventoryModel.setModel(rightStack().model);
		}

		conn.queue('inventory-state', {
			ItemLeft: getEquippedSlot(true, leftIsPrimary),
			ItemRight: getEquippedSlot(false, rightIsPrimary),
		});
	}

	function updateBagVisibility() {
		var $elm = $("#bag");
		if (bagIsShowing) {
			$elm.show();
			controls.unlock();
		} else {
			$elm.hide();
			controls.lock();
		}
	}

	self.resize = function () {
		leftInventoryModel.resize();
		rightInventoryModel.resize();
	};

	var swapLeftWasDown = false;
	var swapRightWasDown = false;
	var toggleBagWasDown = false;
	var leftInventoryModel = new InventoryModel(world, null, 1);
	var rightInventoryModel = new InventoryModel(world, null, -1);
	self.update = function (playerPosition, controlState) {
		if (slots.length === 0) return;
		var p = playerPosition;
		var c = controlState;

		var leftWasDown = updateSide(true);
		var rightWasDown = updateSide(false);

		if (!toggleBagWasDown && c.toggleBag) {
			bagIsShowing = !bagIsShowing;
			updateBagVisibility();
		}
		toggleBagWasDown = c.toggleBag;

		swapLeftWasDown = leftWasDown;
		swapRightWasDown = rightWasDown;

		function activateStack(stack) {
			var action = stack.item.action();
			if (action) {
				action(world, camera);
			} else {
				console.log("Attempted to use an empty item slot.");
			}
		}

		function updateSide(isLeft) {
			var swapWasDown = isLeft ? swapLeftWasDown : swapRightWasDown;
			var side = isLeft ? "Left" : "Right";
			var swapTrigger = "swap" + side;
			var activateTrigger = "activate" + side;
			var stack = isLeft ? leftStack() : rightStack();

			var swapDown = c[swapTrigger];
			if (!swapWasDown && swapDown) {
				if (isLeft) leftIsPrimary = !leftIsPrimary;
				else rightIsPrimary = !rightIsPrimary;
				updateEquipped(isLeft ? stack : null,
							   isLeft ? null : stack);
				updateHtmlEquipChanged(isLeft);
				stack = isLeft ? leftStack() : rightStack();
			}
			
			var invModel = isLeft ? leftInventoryModel : rightInventoryModel;
			invModel.update(playerPosition, c.lat, c.lon);

			if (c[activateTrigger]) {
				activateStack(stack);
			}

			return swapDown;
		};
	};
}

// side: 1 for left; -1 for right.
function InventoryModel(world, model, leftward) {
	var self = this;
	self.update = function (playerPos, lat, lon) {
		pointItem(lat, lon);
		positionItem(playerPos, lat, lon);
		postitionPerspective();
		addJitter();
	}
	
	self.setModel = function (newModel) {
		if (model !== null) {
			world.removeFromScene(model);
		}
		if (newModel === null) return;
		newModel.scale.set(1/16, 1/16, 1/16);
		world.addToScene(newModel);
		model = newModel;
	}
	
	function pointItem(lat, lon) {
		var p = model.position;
		var target = new THREE.Vector3();
		target.x = p.x + sin(lat) * cos(lon);
		target.y = p.y + cos(lat);
		target.z = p.z + sin(lat) * sin(lon);
		model.lookAt(target);
	}

	function positionItem(playerPos, lat, lon) {
		// http://www.vias.org/comp_geometry/math_coord_convert_3d.htm
		var r = 0.15;
		var theta = lat - 0.5;
		var phi = lon;
		var offset = sphericalToCartesian(r, theta, phi);
		
		model.position.copy(playerPos).add(offset);
		
		function sphericalToCartesian(r, theta, phi) {
			return new THREE.Vector3(
				r*sin(theta)*cos(phi),
				r*cos(theta),
				r*sin(theta)*sin(phi)
			);
		}
	}

	var aspectRatio = 1.0;
	self.resize = function () {
		aspectRatio = window.innerWidth / window.innerHeight;
	};
	function postitionPerspective() {
		var p = model.position;
		var r = new THREE.Matrix4();
		r.setRotationFromEuler(model.rotation, model.eulerOrder);

		var amount = leftward * aspectRatio * 0.05;

		// Move left / right
		var mov = new THREE.Vector3(amount, 0, 0);
		mov.applyMatrix3(r);

		p.add(mov);
	}

	var offset = new THREE.Vector3(Math.random(), 0, Math.random());
	function addJitter() {
		offset.x += Math.random() / 30;
		offset.z += Math.random() / 30;
		model.position.x += Math.sin(offset.x) / 400;
		model.position.z += Math.sin(offset.z) / 400;
	}

}

// jQuery UI hack
// http://stackoverflow.com/questions/1853230/jquery-ui-draggable-event-status-on-revert
$.ui.draggable.prototype._mouseStop = function(event) {
	//If we are using droppables, inform the manager about the drop
	var dropped = false;
	if ($.ui.ddmanager && !this.options.dropBehaviour)
		dropped = $.ui.ddmanager.drop(this, event);

	//if a drop comes from outside (a sortable)
	if(this.dropped) {
		dropped = this.dropped;
		this.dropped = false;
	}

	if((this.options.revert == "invalid" && !dropped) || (this.options.revert == "valid" && dropped) || this.options.revert === true || ($.isFunction(this.options.revert) && this.options.revert.call(this.element, dropped))) {
		var self = this;
		self._trigger("reverting", event);
		$(this.helper).animate(this.originalPosition, parseInt(this.options.revertDuration, 10), function() {
			event.reverted = true;
			self._trigger("stop", event);
			self._clear();
		});
	} else {
		this._trigger("stop", event);
		this._clear();
	}

	return false;
};