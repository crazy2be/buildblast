function Inventory(world, camera, slots, left, right) {
    var self = this;
    var initialized = slots.length > 0;

    var elm = document.querySelector('#inventory');

    self.leftSlot = -1;
    self.rightSlot = -1;
    var aspectRatio = 1.0;

    self.resize = function () {
        aspectRatio = window.innerWidth / window.innerHeight;
    };

    function activateSlot(slot) {
        var action = slots[slot].action;
        if (action) {
            action(world, camera);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }

    function generateHTML() {
        var html = "";
        var first = min(leftSlot, rightSlot);
        var second = max(leftSlot, rightSlot);
        var isLeft = first == leftSlot;
        for (var i = 0; i < first; i++) {
            html += "<li>" + slots[i].name + "</li>";
        }
        html += "<li class='selected" + isLeft?"Left":"Right" + "'>" + slots[first].name + "</li>";
        for (var i = first+1; i < second; i++) {
            html += "<li>" + slots[i].name + "</li>";
        }
        html += "<li class='selected" + isLeft?"Right":"Left" + "'>" + slots[second].name + "</li>";
        for (var i = second+1; i < slots.length; i++) {
            html += "<li>" + slots[i].name + "</li>";
        }
        return html;
    }

    function selectSlot(left, right) {
        if (!initialized) return;
        if (left < slots.length) {
            if (leftSlot > -1) {
                world.removeFromScene(slots[leftSlot].model);
            }
            leftSlot = left;

            var model = slots[left].model;
            if (model !== null) {
                model.scale.set(1/16, 1/16, 1/16);
                world.addToScene(model);
            }
        }
        if (right < slots.length) {
            if (rightSlot > -1) {
                world.removeFromScene(slots[rightSlot].model);
            }
            rightSlot = right;

            var model = slots[right].model;
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

    var offsetx = Math.random();
    var offsetz = Math.random();
    function addJitter(item) {
        offsetx += Math.random() / 30;
        offsetz += Math.random() / 30;
        item.position.x += Math.sin(offsetx) / 400;
        item.position.z += Math.sin(offsetz) / 400;
    }

    var nextLeftWasDown = false;
    var nextRightWasDown = false;
    self.update = function (playerPosition, controlState) {
        if (!initialized) return;
        var p = playerPosition;
        var c = controlState;

        // Left item
        var itemLeft = slots[leftSlot].model;
        pointItem(itemLeft, c);
        positionItem(itemLeft, p, c);
        postitionPerspective(itemLeft, -1);
        addJitter(itemLeft);

        // Right item
        var itemRight = slots[rightSlot].model;
        pointItem(itemRight, c);
        positionItem(itemRight, p, c);
        postitionPerspective(itemRight, -1);
        addJitter(itemRight);

        if (!nextLeftWasDown && c[nextLeft]) {
            var offset = (leftSlot + 1) % slots.length == rightSlot ? 2 : 1;
            leftSlot((leftSlot + offset) % slots.length);
        }
        nextLeftWasDown = c[nextLeft];

        if (!nextRightWasDown && c[nextRight]) {
            var offset = (rightSlot + 1) % slots.length == leftSlot ? 2 : 1;
            rightSlot((rightSlot + offset) % slots.length);
        }
        nextRightWasDown = c[nextRight];

        if (c[activateLeft]) {
            activateSlot(leftSlot);
        }
        if (c[activateRight]) {
            activateSlot(rightSlot);
        }
    };

    selectSlot(left, right);
}
