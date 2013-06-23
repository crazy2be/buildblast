function Inventory(world, camera, initLeft, initRight) {
    var self = this;
    var slots = [];
    var initialized = false;

    var elm = document.querySelector('#inventory');

    self.setSlots = function(inv) {
        var changed = false;
        for (var i = 0; i < slots.length; i++) {
            if (slots[i].type != inv[i].type) {
                changed = true;
                break;
            }
        }
        if (!changed && initialized) return;
        initialized = true;
        slots = inv;
        selectSlot(leftSlot, rightSlot);
    };

    var leftSlot = initLeft;
    var rightSlot = initRight;

    self.getLeft = function () { return leftSlot; };
    self.getRight = function () { return rightSlot; };

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
        html += "<div class='selected" + (isLeft?"Left":"Right") + "'>" + slots[first].name() + "</div>";
        for (var i = first+1; i < second; i++) {
            html += "<div>" + slots[i].name() + "</div>";
        }
        html += "<div class='selected" + (isLeft?"Right":"Left") + "'>" + slots[second].name() + "</div>";
        for (var i = second+1; i < slots.length; i++) {
            html += "<div>" + slots[i].name() + "</div>";
        }
        return html;
    }

    function selectSlot(left, right) {
        if (!initialized) return;
        if (left < slots.length && left >= 0) {
            if (leftSlot > -1) {
                world.removeFromScene(slots[leftSlot].model());
            }
            leftSlot = left;
            var model = slots[left].model();
            if (model !== null) {
                model.scale.set(1/16, 1/16, 1/16);
                world.addToScene(model);
            }
        }
        if (right < slots.length && right >= 0) {
            if (rightSlot > -1) {
                world.removeFromScene(slots[rightSlot].model());
            }
            rightSlot = right;

            var model = slots[right].model();
            if (model !== null) {
                model.scale.set(1/16, 1/16, 1/16);
                world.addToScene(model);
            }
        }

        var html = generateHTML();
        elm.innerHTML = html;
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

        // Left item
        var itemLeft = slots[leftSlot].model();
        if (itemLeft !== null) {
            pointItem(itemLeft, c);
            positionItem(itemLeft, p, c);
            postitionPerspective(itemLeft, 1);
            addJitter(itemLeft, leftoffset);
        }

        // Right item
        var itemRight = slots[rightSlot].model();
        if (itemRight != null) {
            pointItem(itemRight, c);
            positionItem(itemRight, p, c);
            postitionPerspective(itemRight, -1);
            addJitter(itemRight, rightoffset);
        }

        if (!nextLeftWasDown && c["nextLeft"]) {
            var newSlot = (leftSlot + 1) % slots.length;
            if (newSlot == rightSlot) {
                newSlot = (newSlot + 1) % slots.length;
            }
            selectSlot(newSlot, -1);
        }
        nextLeftWasDown = c["nextLeft"];

        if (!nextRightWasDown && c["nextRight"]) {
            var newSlot = (rightSlot + 1) % slots.length;
            if (newSlot == leftSlot) {
                newSlot = (newSlot + 1) % slots.length;
            }
            selectSlot(-1, newSlot);
        }
        nextRightWasDown = c["nextRight"];

        if (c["activateLeft"]) {
            activateSlot(leftSlot);
        }
        if (c["activateRight"]) {
            activateSlot(rightSlot);
        }
    };
}
