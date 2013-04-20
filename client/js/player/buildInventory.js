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
    },
    {
        name: 'stone',
        model: Models.stone(),
        action: stoneAction,
    }
    ];

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
