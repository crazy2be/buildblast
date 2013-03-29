function WeaponInventory(world, camera) {
    var slots = [
        {
            name: 'pistol',
            model: Models.pistol(),
            action: pistolAction,
        }
    ];

    function pistolAction() {
        var intersect = world.findPlayerIntersection(camera);
        if (intersect) {
            console.log("Hit!!", intersect, intersect.item);
            world.addSmallCube(intersect.point);
        } else {
            console.log("miss!!");
        }
    }

    var elm = document.getElementById('weapon-inventory');

    return new Inventory(world, camera, slots, elm, 0.05, 'nextWeapon', 'activateWeapon');
}

function BlockInventory(world, camera) {
    var slots = [
        {
            name: 'shovel',
            model: Models.shovel(),
            action: shovelAction,
        },
        {
            name: 'block',
            model: Models.block(),
            action: blockAction,
        }
    ];

    function shovelAction() {
        world.removeLookedAtBlock(camera);
    }

    function blockAction() {
        world.addLookedAtBlock(camera);
    }

    var elm = document.getElementById('block-inventory');

    return new Inventory(world, camera, slots, elm, -0.05, 'nextBlock', 'activateBlock');
}

function Inventory(world, camera, slots, elm, leftwardOffset, nextAction, activateAction) {
    var self = this;

    var currentSlot = -1;

    self.doAction = function () {
        var action = slots[currentSlot].action;
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
            world.removeFromScene(slots[currentSlot].model);
        }
        world.addToScene(slots[n].model);
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

    var nextWasDown = false;
    self.update = function (playerPosition, controlState) {
        var p = playerPosition;
        var c = controlState;
        var item = slots[currentSlot].model;
        positionItem(item, p, c);
        pointItem(item, c);
        postitionPerspective(item, leftwardOffset);

        if (!nextWasDown && c[nextAction]) {
            selectSlot((currentSlot + 1) % slots.length);
        }
        nextWasDown = c[nextAction];

        if (c[activateAction]) {
            self.doAction();
        }
    }

    selectSlot(0);
}

function generateInventoryHTML(slots, selectedIndex) {
    var html = "";
    for (var i = 0; i < selectedIndex; i++) {
        html += "<li>" + slots[i].name + "</li>";
    }
    html += "<li class='selected'>" + slots[selectedIndex].name + "</li>";
    for (var i = selectedIndex+1; i < slots.length; i++) {
        html += "<li>" + slots[i].name + "</li>";
    }
    return html;
}
