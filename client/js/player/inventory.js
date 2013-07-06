function Inventory(world, camera, conn) {
    var self = this;
    var BAG_SIZE = 25;
    var slots = [];

    var leftIsPrimary = true;
    var rightIsPrimary = true;

    function getEquippedSlot(isLeft, isPrimary) {
        index = BAG_SIZE;
        if (!isLeft) index += 2;
        if (!isPrimary) index += 1;
        return index;
    }

    function leftItem() {
        return slots[getEquippedSlot(true, leftIsPrimary)];
    }

    function rightItem() {
        return slots[getEquippedSlot(false, rightIsPrimary)];
    }

    var bagIsShowing = false;

    bagHtmlInit();
    updateHtmlEquipChanged(true);
    updateHtmlEquipChanged(false);

    conn.on('inventory-state', function (payload) {
        // Decode from the string
        var items = new Uint8Array(payload.Items.length);
        for (var i = 0; i < items.length; i++) {
            items[i] = payload.Items.charCodeAt(i) - 32;
        }

        // Create the item array, track if it changed
        if (!anyChanged(items)) return;
        var oldLeft = slots.length > 0 ? leftItem() : Item.NIL();
        var oldRight = slots.length > 0 ? rightItem() : Item.NIL();
        if (slots.length > items.length) slots = [];
        for (var i = 0; i < items.length; i++) {
            slots[i] = new Item(items[i]);
        }
        updateEquipped(oldLeft, oldRight);
        updateHtmlItemIcons();
    });

    function anyChanged(items) {
        if (slots.length !== items.length) return true;
        for (var i = 0; i < items.length; i++) {
            if (slots[i].type !== items[i]) return true;
        }
        return false;
    }

    var aspectRatio = 1.0;

    self.resize = function () {
        aspectRatio = window.innerWidth / window.innerHeight;
    };

    function bagHtmlInit() {
        var html = "";
        var classList;
        for (var y = 0; y < 5; y++) {
            for (var x = 0; x < 5; x++) {
                classList = "slot";
                if (x !== 0) classList += " has-left-sibling";
                if (y !== 0) classList += " has-top-sibling";
                html += '<div id="bag' + (y*5 + x) + '" class="' + classList + '">'
                    + '<img src="/img/item_icons/nil.png" height="64" width="64">'
                    + '</div>';
            }
        }
        updateBagVisibility();
        $("#bag").html(html);
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
        for (var y = 0; y < 5; y++) {
            for (var x = 0; x < 5; x++) {
                var index = y*5 + x;
                $("#bag" + index).children("img").attr("src", slots[index].icon());
            }
        }
        $("#leftPrimary").children("img").attr("src", slots[BAG_SIZE].icon());
        $("#leftReserve").children("img").attr("src", slots[BAG_SIZE + 1].icon());
        $("#rightPrimary").children("img").attr("src", slots[BAG_SIZE + 2].icon());
        $("#rightReserve").children("img").attr("src", slots[BAG_SIZE + 3].icon());
    }

    function updateEquipped(oldLeft, oldRight) {
        if (slots.length === 0) return;

        var leftChanged = false;
        var rightChanged = false;
        if (oldLeft !== null) {
            leftChanged = swapModels(oldLeft, leftItem());
        }
        if (oldRight !== null) {
            rightChanged = swapModels(oldRight, rightItem());
        }

        if (!leftChanged && !rightChanged) return;

        conn.queue('inventory-state', {
            ItemLeft: getEquippedSlot(true, leftIsPrimary),
            ItemRight: getEquippedSlot(false, rightIsPrimary),
        });
    }

    function updateBagVisibility() {
        if (bagIsShowing) $("#bag").show();
        else $("#bag").hide();
    }

    function swapModels(oldItem, newItem) {
        if (oldItem.type === newItem.type) return false;
        if (oldItem.model() !== null) {
            world.removeFromScene(oldItem.model());
        }
        var model = newItem.model();
        if (model !== null) {
            model.scale.set(1/16, 1/16, 1/16);
            world.addToScene(model);
        }
        return true;
    }

    function pointItem(item, c) {
        var p = item.position;
        var target = new THREE.Vector3();
        target.x = p.x + sin(c.lat) * cos(c.lon);
        target.y = p.y + cos(c.lat);
        target.z = p.z + sin(c.lat) * sin(c.lon);
        item.lookAt(target);
    }

    function positionItem(item, playerPos, c) {
        var pp = playerPos;
        var ip = item.position;

        // http://www.vias.org/comp_geometry/math_coord_convert_3d.htm
        var theta = c.lat - 0.5;
        var phi = c.lon;
        var r = 0.15;
        var offset = sphericalToCartesian(r, theta, phi);
        ip.copy(pp).add(offset);
    }

    function sphericalToCartesian(r, theta, phi) {
        return new THREE.Vector3(
            r*sin(theta)*cos(phi),
            r*cos(theta),
            r*sin(theta)*sin(phi)
        );
    }

    function postitionPerspective(item, leftward) {
        var p = item.position;
        var r = new THREE.Matrix4();
        r.setRotationFromEuler(item.rotation, item.eulerOrder);

        var amount = leftward * aspectRatio * 0.05;

        // Mov left / right
        var mov = new THREE.Vector3(amount, 0, 0);
        mov.applyMatrix3(r);

        p.add(mov);
    }

    var leftOffset = { x: Math.random(), z: Math.random() };
    var rightOffset = { x: Math.random(), z: Math.random() };
    function addJitter(item, values) {
        values.x += Math.random() / 30;
        values.z += Math.random() / 30;
        item.position.x += Math.sin(values.x) / 400;
        item.position.z += Math.sin(values.z) / 400;
    }

    var swapLeftWasDown = false;
    var swapRightWasDown = false;
    var toggleBagWasDown = false;
    self.update = function (playerPosition, controlState) {
        if (slots.length === 0) return;
        var p = playerPosition;
        var c = controlState;

        var leftWasDown = updateSide(true);
        var rightWasDown = updateSide(false);

        var toggleBagDown = c["toggleBag"];
        if (!toggleBagWasDown && toggleBagDown) {
            bagIsShowing = !bagIsShowing;
            updateBagVisibility();
            console.log(bagIsShowing);
        }
        toggleBagWasDown = toggleBagDown;

        swapLeftWasDown = leftWasDown;
        swapRightWasDown = rightWasDown;

        function activateItem(item) {
            var action = item.action();
            if (action) {
                action(world, camera);
            } else {
                console.log("Attempted to use an empty item slot.");
            }
        }

        function updateSide(isLeft) {
            var pos = isLeft ? 1 : -1;
            var offset = isLeft ? leftOffset : rightOffset;
            var swapWasDown = isLeft ? swapLeftWasDown : swapRightWasDown;
            var side = isLeft ? "Left" : "Right";
            var swapTrigger = "swap" + side;
            var activateTrigger = "activate" + side;
            var item = isLeft ? leftItem() : rightItem();
            var itemModel = item.model();

            if (itemModel !== null) {
                pointItem(itemModel, c);
                positionItem(itemModel, p, c);
                postitionPerspective(itemModel, pos);
                addJitter(itemModel, offset);
            }

            var swapDown = c[swapTrigger];
            if (!swapWasDown && swapDown) {
                if (isLeft) leftIsPrimary = !leftIsPrimary;
                else rightIsPrimary = !rightIsPrimary;
                updateEquipped((isLeft ? item : null),
                               (isLeft ? null : item));
                updateHtmlEquipChanged(isLeft);
            }

            if (c[activateTrigger]) {
                activateItem(item);
            }

            return swapDown;
        };
    };
}
