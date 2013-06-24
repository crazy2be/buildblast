function Inventory(world, camera, conn, initLeft, initRight) {
    var self = this;
    var slots = [];
    var initialized = false;

    var elm = document.querySelector('#inventory');

    conn.on('inventory-state', function (payload) {
        // Decode from the string
        var items = new Uint8Array(payload.Items.length);
        for (var i = 0; i < items.length; i++) {
            items[i] = payload.Items.charCodeAt(i) - 32;
        }

        // Create the item array, track if it changed
        var invItems = [];
        var anyChanged = false;
        for (var i = 0; i < items.length; i++) {
            invItems[i] = new Item(items[i]);
            if (slots.length !== items.length || slots[i].type !== items[i]) {
                anyChanged = true;
            }
        }
        if (!anyChanged && initialized) return;
        initialized = true;
        slots = invItems;
        selectSlot(leftSlot, rightSlot);
    });

    var leftSlot = initLeft;
    var rightSlot = initRight;

    var aspectRatio = 1.0;

    self.resize = function () {
        aspectRatio = window.innerWidth / window.innerHeight;
    };

    function activateSlot(slot) {
        var action = slots[slot].action();
        if (action) {
            action(world, camera);
        } else {
            console.log("Attempted to use an empty item slot.");
        }
    }

    function generateHTML() {
        var html = "";
        var first = min(leftSlot, rightSlot);
        var second = max(leftSlot, rightSlot);
        var isLeft = first == leftSlot;
        for (var i = 0; i < first; i++) {
            html += "<div>" + slots[i].name() + "</div>";
        }
        html += "<div class='selected-" + (isLeft?"left":"right") + "'>" + slots[first].name() + "</div>";
        for (var i = first+1; i < second; i++) {
            html += "<div>" + slots[i].name() + "</div>";
        }
        html += "<div class='selected-" + (isLeft?"right":"left") + "'>" + slots[second].name() + "</div>";
        for (var i = second+1; i < slots.length; i++) {
            html += "<div>" + slots[i].name() + "</div>";
        }
        return html;
    }

    function selectSlot(left, right) {
        if (!initialized) return;
        if (left === -1 && right === -1) return;

        leftSlot = updateModels(leftSlot, left);
        rightSlot = updateModels(rightSlot, right);

        conn.queue('inventory-state', {
            ItemLeft: leftSlot,
            ItemRight: rightSlot,
        });

        var html = generateHTML();
        elm.innerHTML = html;
    }

    function updateModels(curSlot, newSlot) {
        if (newSlot < slots.length && newSlot >= 0) {
            if (curSlot > -1) {
                world.removeFromScene(slots[curSlot].model());
            }
            var model = slots[newSlot].model();
            if (model !== null) {
                model.scale.set(1/16, 1/16, 1/16);
                world.addToScene(model);
            }
            return newSlot;
        }
        return curSlot;
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

    var leftoffset = [Math.random(), Math.random()];
    var rightoffset = [Math.random(), Math.random()];
    function addJitter(item, values) {
        values[0] += Math.random() / 30;
        values[1] += Math.random() / 30;
        item.position.x += Math.sin(values[0]) / 400;
        item.position.z += Math.sin(values[1]) / 400;
    }

    var nextLeftWasDown = false;
    var nextRightWasDown = false;
    self.update = function (playerPosition, controlState) {
        if (!initialized) return;
        var p = playerPosition;
        var c = controlState;

        var leftResult = updateEquipped(p, c, 1, leftSlot, rightSlot, leftoffset,
                nextLeftWasDown, "nextLeft", "activateLeft");
        var rightResult = updateEquipped(p, c, -1, rightSlot, leftSlot, rightoffset,
                nextRightWasDown, "nextRight", "activateRight");

        if (leftResult != -1 || rightResult != -1) {
            selectSlot(leftResult[0], rightResult[0]);
        }

        nextLeftWasDown = leftResult[1];
        nextRightWasDown = rightResult[1];
    };

    function updateEquipped(p, c, pos, slot, oppositeSlot, offset, nextWasDown, nextTrigger, activateTrigger) {
        var newSlot = -1;
        var itemModel = slots[slot].model();
        if (itemModel !== null) {
            pointItem(itemModel, c);
            positionItem(itemModel, p, c);
            postitionPerspective(itemModel, pos);
            addJitter(itemModel, offset);
        }

        if (!nextWasDown && c[nextTrigger]) {
            newSlot = (slot + 1) % slots.length;
            if (newSlot == oppositeSlot) {
                newSlot = (newSlot + 1) % slots.length;
            }
        }

        if (c[activateTrigger]) {
            activateSlot(slot);
        }

        return [newSlot, c[nextTrigger]];
    }
}
