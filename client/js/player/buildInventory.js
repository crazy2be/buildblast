function BuildInventory(world, camera) {
    var slots = [
    {
        name: 'shovel',
        model: Models.shovel(),
        action: throttle(shovelAction),
    },
    {
        name: 'block',
        model: Models.block(),
        action: throttle(blockAction),
    },
    {
        name: 'stone',
        model: Models.stone(),
        action: throttle(stoneAction),
    }
    ];

    function throttle(func) {
        t = Date.now();
        return function () {
            t2 = Date.now();
            if (t2 - t > 200) {
                func();
                t = t2;
            }
        }
    }

    function shovelAction() {
        world.removeLookedAtBlock(camera);
    }

    function blockAction() {
        world.addLookedAtBlock(camera, Block.DIRT);
    }

    function stoneAction() {
        world.addLookedAtBlock(camera, Block.STONE);
    }

    var elm = document.querySelector('#inventory .build');

    return new Inventory(world, camera, slots, elm, 1, 'nextBuilder', 'activateBuilder');
}
