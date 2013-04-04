function BlastInventory(world, camera) {
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

    return new Inventory(world, camera, slots, elm, 1, 'nextWeapon', 'activateWeapon');
}

function BuildInventory(world, camera) {
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

    return new Inventory(world, camera, slots, elm, -1, 'nextBlock', 'activateBlock');
}

function Inventory(world, camera, slots, elm, leftwardOffset, nextAction, activateAction) {
    var self = this;

    var currentSlot = -1;

    function activateCurrentSlot() {
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
        var model = slots[n].model;
        model.scale.set(1/16, 1/16, 1/16);
        world.addToScene(model);
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

    var nextWasDown = false;
    self.update = function (playerPosition, controlState) {
        var p = playerPosition;
        var c = controlState;
        var item = slots[currentSlot].model;
        pointItem(item, c);
        positionItem(item, p, c);
        postitionPerspective(item, leftwardOffset);
        addJitter(item);

        if (!nextWasDown && c[nextAction]) {
            selectSlot((currentSlot + 1) % slots.length);
        }
        nextWasDown = c[nextAction];

        if (c[activateAction]) {
            activateCurrentSlot();
        }
    }

    var aspectRatio = 1.0;
    self.resize = function () {
        aspectRatio = window.innerWidth / window.innerHeight;
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
