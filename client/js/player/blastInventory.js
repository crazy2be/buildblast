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
		} else {
			console.log("miss!!");
		}
	}

	var elm = document.querySelector('#inventory .blast');

	return new Inventory(world, camera, slots, elm, -1, 'nextBlaster', 'activateBlaster');
}
