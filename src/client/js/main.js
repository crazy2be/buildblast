(function () {
    var container, stats;

    var camera, controls, scene, renderer;

    var mesh;

    var worldWidth = 128, worldDepth = 128,
    worldHalfWidth = worldWidth / 2, worldHalfDepth = worldDepth / 2,
    data = generateHeight(worldWidth, worldDepth);

    var clock = new THREE.Clock();

    init();
    animate();

    function init() {
        container = document.getElementById('container');
        
        camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.01, 200);
        camera.position.y = getY(worldHalfWidth, worldHalfDepth) + 1;
        
        controls = new THREE.FirstPersonControls(camera, container);
        
        controls.movementSpeed = 10;
        controls.lookSpeed = 0.125;
        controls.lookVertical = true;
        controls.constrainVertical = true;
        controls.heightSpeed = 1;
        
        scene = new THREE.Scene();
        
        // sides
        
        var matrix = new THREE.Matrix4();
        
        var pxGeometry = new THREE.PlaneGeometry(1, 1);
        pxGeometry.faces[0].materialIndex = 1;
        pxGeometry.applyMatrix(matrix.makeRotationY(Math.PI / 2));
        pxGeometry.applyMatrix(matrix.makeTranslation(0.5, 0, 0));
        
        var nxGeometry = new THREE.PlaneGeometry(1, 1);
        nxGeometry.faces[0].materialIndex = 1;
        nxGeometry.applyMatrix(matrix.makeRotationY(-Math.PI/2));
        nxGeometry.applyMatrix(matrix.makeTranslation(-0.5, 0, 0));
        
        var pyGeometry = new THREE.PlaneGeometry(1, 1);
        pyGeometry.faces[0].materialIndex = 0;
        pyGeometry.applyMatrix(matrix.makeRotationX(-Math.PI/2));
        pyGeometry.applyMatrix(matrix.makeTranslation(0, 0.5, 0));
        
        var pzGeometry = new THREE.PlaneGeometry(1, 1);
        pzGeometry.faces[0].materialIndex = 1;
        pzGeometry.applyMatrix(matrix.makeTranslation(0, 0, 0.5));
        
        var nzGeometry = new THREE.PlaneGeometry(1, 1);
        nzGeometry.faces[0].materialIndex = 1;
        nzGeometry.applyMatrix(matrix.makeRotationY(Math.PI));
        nzGeometry.applyMatrix(matrix.makeTranslation(0, 0, -0.5));
        
        var geometry = new THREE.Geometry();
        var dummy = new THREE.Mesh();
        
        for (var z = 0; z < worldDepth; z++) {
            for (var x = 0; x < worldWidth; x++) {
                var h = getY(x, z);
                
                dummy.position.x = x - worldHalfWidth;
                dummy.position.y = h;
                dummy.position.z = z - worldHalfDepth;
                
                var px = getY(x + 1, z);
                var nx = getY(x - 1, z);
                var pz = getY(x, z + 1);
                var nz = getY(x, z - 1);
                
                dummy.geometry = pyGeometry;
                THREE.GeometryUtils.merge(geometry, dummy);
                
                if ((px != h && px != h + 1) || x == 0) {
                    dummy.geometry = pxGeometry;
                    THREE.GeometryUtils.merge(geometry, dummy);
                }
                
                if ((nx != h && nx != h + 1) || x == worldWidth - 1) {
                    dummy.geometry = nxGeometry;
                    THREE.GeometryUtils.merge(geometry, dummy);
                }
                
                if ((pz != h && pz != h + 1) || z == worldDepth - 1) {
                    dummy.geometry = pzGeometry;
                    THREE.GeometryUtils.merge(geometry, dummy);
                }
                
                if ((nz != h && nz != h + 1) || z == 0) {
                    dummy.geometry = nzGeometry;
                    THREE.GeometryUtils.merge(geometry, dummy);
                }
            }
        }
        
        var textureGrass = THREE.ImageUtils.loadTexture('img/minecraft/grass.png');
        textureGrass.magFilter = THREE.NearestFilter;
        textureGrass.minFilter = THREE.LinearMipMapLinearFilter;
        
        var textureGrassDirt = THREE.ImageUtils.loadTexture('img/minecraft/grass_dirt.png');
        textureGrassDirt.magFilter = THREE.NearestFilter;
        textureGrassDirt.minFilter = THREE.LinearMipMapLinearFilter;
        
        var material1 = new THREE.MeshLambertMaterial({
            map: textureGrass,
            ambient: 0xbbbbbb
        });
        var material2 = new THREE.MeshLambertMaterial({
            map: textureGrassDirt,
            ambient: 0xbbbbbb
        });
        
        var mesh = new THREE.Mesh(geometry, new THREE.MeshFaceMaterial([material1, material2]));
        scene.add(mesh);
        
        var ambientLight = new THREE.AmbientLight(0xcccccc);
        scene.add(ambientLight);
        
        var directionalLight = new THREE.DirectionalLight(0xffffff, 2);
        directionalLight.position.set(1, 1, 0.5).normalize();
        scene.add(directionalLight);
        
        renderer = new THREE.WebGLRenderer();
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        container.innerHTML = "";
        
        container.appendChild(renderer.domElement);
        
        stats = new Stats();
        stats.domElement.style.position = 'absolute';
        stats.domElement.style.top = '0px';
        container.appendChild(stats.domElement);
        
        window.addEventListener('resize', onWindowResize, false);
        
    }

    function onWindowResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        
        renderer.setSize(window.innerWidth, window.innerHeight);
        
        controls.handleResize();
    }

    function generateHeight(width, height) {
        var data = [];
        var perlin = new ImprovedNoise();
        var size = width * height;
        var quality = 2;
        var z = Math.random() * 100;
        
        for (var i = 0; i < size; i++) {
            data[i] = 0;
        }
        
        for (var i = 0; i < 4; i++) {
            for (var j = 0; j < size; j++) {
                var x = j % width
                var y = (j / width) | 0;
                
                data[j] += perlin.noise(x / quality, y / quality, z) * quality;
            }
            quality *= 4
        }
        return data;
    }

    function getY(x, z) {
        return (data[x + z*worldWidth] * 0.2) | 0;
    }
    
    function getWorldY(x, z) {
        var gx = (x + worldHalfWidth) | 0;
        var gz = (z + worldHalfDepth) | 0;
        var gy = getY(gx, gz);
        return gy;
    }

    function minMag(a, b) {
        return Math.abs(a) < Math.abs(b) ? a : b;
    }
    var playerV = 0;
    function animate() {
        requestAnimationFrame(animate);
        
        var dt = clock.getDelta();
        controls.update(dt);
        
        var p = camera.position;
        var y = getWorldY(p.x, p.z) + 2;
        if (p.y < y) {
            camera.translateY(y - p.y);
            playerV = 0;
        } else {
            camera.translateY(minMag(y - p.y, playerV));
            playerV += dt * -9.81;
        }
        
        renderer.render(scene, camera);
        stats.update();
    }
}());