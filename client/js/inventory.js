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
            var point = world.findTargetIntersection(camera).p;
            if (point) world.addSmallCube(point);
        } else if (selectedItem == 'shovel') {
            world.removeLookedAtBlock(camera);
        } else if (selectedItem == 'block') {
            world.addLookedAtBlock(camera);
        } else {
            throw "Not sure what to do with the currently selected item: '" + selectedItem + "'";
        }
    }
    
    var selectElm = document.getElementById('selection');
    self.selectSlot = function (n) {
        var html = "";
        for (var i = 0; i < n; i++) {
            html += "<span class='not-selected'>" + slots[i] + "</span>";
        }
        html += "<span class='selected'>" + slots[n] + "</span>";
        for (var i = n+1; i < slots.length; i++) {
            html += "<span class='not-selected'>" + slots[i] + "</span>";
        }
        selectElm.innerHTML = html;
        currentSlot = n;
    }
    
    self.selectSlot(0);
}