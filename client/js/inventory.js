function Inventory(world, camera) {
    var self = this;

    var slots = [
        'gun',
        'shovel',
        'block',
    ];
    var currentSlot = 0;

    self.leftClick = function () {
        var selectedItem = slots[currentSlot];

        if (selectedItem == 'gun') {
            var intersect = world.findTargetIntersection(camera);
            if (intersect) world.addSmallCube(intersect.point);
        } else if (selectedItem == 'shovel') {
            world.removeLookedAtBlock(camera);
        } else if (selectedItem == 'block') {
            world.addLookedAtBlock(camera);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }

    self.selectSlot = function (n) {
        var html = "";
        for (var i = 0; i < n; i++) {
            html += "<li>" + slots[i] + "</li>";
        }
        html += "<li class='selected'>" + slots[n] + "</li>";
        for (var i = n+1; i < slots.length; i++) {
            html += "<li>" + slots[i] + "</li>";
        }
        var selection = document.getElementById('selection');
        if (selection) selection.innerHTML = html;
        currentSlot = n;
    }

    self.selectSlot(0);
}
