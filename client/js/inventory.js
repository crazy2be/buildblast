function BlockInventory(world, camera) {
    var self = this;

    var slots = [
        'shovel',
        'block',
        'test',
    ];

    var currentSlot = 0;

    self.doAction = function () {
        var selectedItem = slots[currentSlot];
        if (selectedItem == 'shovel') {
            world.removeLookedAtBlock(camera);
        } else if (selectedItem == 'block') {
            world.addLookedAtBlock(camera);
        } else if (selectedItem == 'test') {
            world.addTest(camera);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }

    function selectSlot(n) {
        var html = generateInventoryHTML(slots, n);
        document.getElementById('block-inventory').innerHTML = html;
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

function WeaponInventory(world, camera) {
    var self = this;

    var slots = [
        'gun',
    ];

    var currentSlot = 0;

    self.doAction = function () {
        var selectedItem = slots[currentSlot];
        if (selectedItem === 'gun') {
            var intersect = world.findTargetIntersection(camera);
            if (intersect) world.addSmallCube(intersect.point);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }

    function selectSlot(n) {
        var html = generateInventoryHTML(slots, n);
        document.getElementById('weapon-inventory').innerHTML = html;
        currentSlot = n;
    }

    self.update = function (controlState) {

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
