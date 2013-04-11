function include(path, names) {
    for (var i = 0; i < names.length; i++) {
        var script = document.createElement('script');
        script.src = path + names[i] + '.js';
        document.body.appendChild(script);
    }
}

include('/js/entities/', [
    'entity',
    'manager',
	'player',
]);
