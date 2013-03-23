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

    return new Inventory(world, camera, slots, models, actions, elm);
}

function BlockInventory(world, camera) {
    var slots = [
        'shovel',
        'block',
        'test',
    ];

    var models = [
        Models.shovel(),
        Models.block(),
        Models.world(),
    ];

    var actions = [
        function () {
            world.removeLookedAtBlock(camera);
        },
        function () {
            world.addLookedAtBlock(camera);
        },
        function () {
            world.addTest(camera);
        }
    ];

    var elm = document.getElementById('block-inventory');

    return new Inventory(world, camera, slots, models, actions, elm);
}

function Inventory(world, camera, slots, models, actions, elm) {
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
        var html = generateInventoryHTML(slots, n);
        elm.innerHTML = html;
        if (currentSlot > -1) {
            world.removeFromScene(models[currentSlot]);
        }
        world.addToScene(models[n]);
        currentSlot = n;
    }

    self.update = function (controlState) {
        var c = controlState;
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
