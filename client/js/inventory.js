function WeaponInventory(world, camera) {
    var slots = [
        'pistol',
    ];

    var models = [
        Models.pistol(),
    ];

    var actions = [
        function () {
            var intersect = world.findTargetIntersection(camera);
            if (intersect) world.addSmallCube(intersect.point);
        }
    ];

    var elm = document.getElementById('weapon-inventory');

    return new Inventory(world, camera, slots, models, actions, elm, 0.05);
}

function BlockInventory(world, camera) {
    var slots = [
        'shovel',
        'block',
    ];

    var models = [
        Models.shovel(),
        Models.block(),
    ];

    var actions = [
        function () {
            world.removeLookedAtBlock(camera);
        },
        function () {
            world.addLookedAtBlock(camera);
        },
    ];

    var elm = document.getElementById('block-inventory');

    return new Inventory(world, camera, slots, models, actions, elm, -0.05);
}

function Inventory(world, camera, slots, models, actions, elm, leftwardOffset) {
    var self = this;

    var currentSlot = -1;

    self.doAction = function () {
        var action = actions[currentSlot];
        if (action) {
            action();
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }

    function selectSlot(n) {
        if (slots.length <= n) return;
        var html = generateInventoryHTML(slots, n);
        elm.innerHTML = html;
        if (currentSlot > -1) {
            world.removeFromScene(models[currentSlot]);
        }
        world.addToScene(models[n]);
        currentSlot = n;
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
        ip.x = pp.x + 0.15 * sin(c.lat) * cos(c.lon)
        ip.y = pp.y + 0.15 * cos(c.lat);
        ip.z = pp.z + 0.15 * sin(c.lat) * sin(c.lon);
    }

    function postitionPerspective(item, leftward) {
        var p = item.position;
        var r = new THREE.Matrix4();
        r.setRotationFromEuler(item.rotation, item.eulerOrder);

        // Mov left / right
        var mov = new THREE.Vector3(leftward, 0, 0);
        mov.applyMatrix3(r);

        p.x += mov.x;
        p.y += mov.y;
        p.z += mov.z;
    }

    self.update = function (playerPosition, controlState) {
        var p = playerPosition;
        var c = controlState;
        var item = models[currentSlot];
        positionItem(item, p, c);
        pointItem(item, c);
        postitionPerspective(item, leftwardOffset);

        if (c.selectSlot1) {
            selectSlot(0);
        } else if (c.selectSlot2) {
            selectSlot(1);
        } else if (c.selectSlot3) {
            selectSlot(2);
        }
    }

    selectSlot(0);
}

function generateInventoryHTML(slots, selectedIndex) {
    var html = "";
    for (var i = 0; i < selectedIndex; i++) {
        html += "<li>" + slots[i] + "</li>";
    }
    html += "<li class='selected'>" + slots[selectedIndex] + "</li>";
    for (var i = selectedIndex+1; i < slots.length; i++) {
        html += "<li>" + slots[i] + "</li>";
    }
    return html;
}
