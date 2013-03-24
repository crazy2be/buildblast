function WeaponInventory(world, camera) {
    var slots = [
        'pistol',
    ];

    var models = [
        Models.pistol(),
    ];

    var actions = [
        function () {
            var intersect = world.findPlayerIntersection(camera);
            if (intersect) {
                console.log("Hit!!", intersect, intersect.item);
                world.addSmallCube(intersect.point);
            } else {
                console.log("miss!!");
            }
        }
    ];

    var elm = document.getElementById('weapon-inventory');

    return new Inventory(world, camera, slots, models, actions, elm, 0.1);
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

    return new Inventory(world, camera, slots, models, actions, elm, -0.1);
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

    function positionItem(item, playerPos, c, leftward) {
        var pp = playerPos;
        var ip = item.position;
        ip.x = pp.x + -cos(c.lon) * 0.09 - sin(c.lon) * leftward;
        ip.y = pp.y + -0.1;
        ip.z = pp.z + -sin(c.lon) * 0.09 + cos(c.lon) * leftward;
    }


    self.update = function (playerPosition, controlState) {
        var p = playerPosition;
        var c = controlState;
        var item = models[currentSlot];
        positionItem(item, p, c, leftwardOffset);
        pointItem(item, c);

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
