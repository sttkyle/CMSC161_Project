// imports
import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// declarations
let camera, scene, renderer, controls;
// const models = [
//     '/models/beer.glb',
//     '/models/dolab.glb',
//     '/models/ferris.glb',
//     '/models/sahara.glb',
//     '/models/spectra.glb'
// ];
const models = ['/models/scene.glb']

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;

let woohooMp3 = document.getElementById('woohoosound');
let clapMp3 = document.getElementById('clapsound');
let drinkMp3 = document.getElementById('drinksound');

const clapGIF = "public/assets/clapping.gif";
const woohooGIF = "public/assets/woohoo.gif";
const drinkGIF = "public/assets/drinking.gif";

const saharaTitle = "public/assets/sahara.png";
const wheelTitle = "public/assets/wheel.png";
const beerTitle = "public/assets/beerbarn.png";

let prevTime = performance.now();
const velocity = new THREE.Vector3();
const direction = new THREE.Vector3();
const vertex = new THREE.Vector3();

// initialization
function init() {
    const width = window.innerWidth, height = window.innerHeight;

    // setup camera
    camera = new THREE.PerspectiveCamera(75, width / height, 1, 1000);
    camera.position.set(-400, 10, 575);
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // setup scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    scene.fog = new THREE.Fog(0xffffff, 0, 1000);

    // load models
    loadModels()

    // floor
    let floorGeometry = new THREE.PlaneGeometry(2048, 2048, 100, 100);
    floorGeometry.rotateX(-Math.PI / 2); // a plane along the x axis

    // setting variable vertex positions
    let position = floorGeometry.attributes.position;
    for (let i = 0, l = position.count; i < l; i ++) {
        vertex.fromBufferAttribute(position, i);

        vertex.x += Math.random() * 20 - 10;
        vertex.y += Math.random() * 2;
        vertex.z += Math.random() * 20 - 10;

        position.setXYZ(i, vertex.x, vertex.y, vertex.z);   // change position of vertices along the floor to random values
    }
    // setting variable vertex colors
    floorGeometry = floorGeometry.toNonIndexed();
    position = floorGeometry.attributes.position;
    const colors = [
        new THREE.Color(0x7C9D51),
        new THREE.Color(0x4F7422),
        new THREE.Color(0x62843B),
        new THREE.Color(0x6F9137),
        new THREE.Color(0x7EA44F),
    ];
    const colorsFloor = [];
    for (let i = 0, l = position.count; i < l; i ++) {
        let color = colors[Math.floor(Math.random() * colors.length)]
        colorsFloor.push(color.r, color.g, color.b);
    }
    floorGeometry.setAttribute('color', new THREE.Float32BufferAttribute(colorsFloor, 3));

    let floorMaterial = new THREE.MeshPhongMaterial({ vertexColors: true });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.receiveShadow = true;
    scene.add(floor);

    // Load Lights into Scene
    loadLights();

    // setup renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.shadowMap.enabled = true; // enabling shadows
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.setSize(width, height);
    document.body.appendChild(renderer.domElement);

    // setup controller
    // ref: https://github.com/mrdoob/three.js/blob/master/examples/misc_controls_pointerlock.html
    const blocker = document.getElementById('blocker'); 
    const instructions = document.getElementById('instructions'); // dom element to "disable" or "enable" mouse while on instruction screen

    controls = new PointerLockControls(camera, renderer.domElement);
    instructions.addEventListener('click', function() {
        controls.lock();
    });

    controls.addEventListener('lock', function() {  // if controls are locked, remove dom elements
        instructions.style.display = 'none';
        blocker.style.display = 'none';
    });
    controls.addEventListener('unlock', function() {  // else show them again
        blocker.style.display = 'block';
        instructions.style.display = '';
    });

    scene.add(controls.getObject());

    // movement key listeners
    const onKeyDown = function(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = true;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = true;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = true;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = true;
                break;
            case 'Digit1':
                woohooMp3.play();
                showGIF(woohooGIF, 1000, 2250);
                break;
            case 'Digit2':
                clapMp3.play();
                showGIF(clapGIF, 200, 3000);
                break;
            case 'Digit3':
                drinkMp3.play();
                showGIF(drinkGIF, 0, 2000)
                break;
        }
    };

    const onKeyUp = function(event) {
        switch (event.code) {
            case 'ArrowUp':
            case 'KeyW':
                moveForward = false;
                break;
            case 'ArrowLeft':
            case 'KeyA':
                moveLeft = false;
                break;
            case 'ArrowDown':
            case 'KeyS':
                moveBackward = false;
                break;
            case 'ArrowRight':
            case 'KeyD':
                moveRight = false;
                break;
        }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    animate();
}

// show interaction GIFs
function showGIF(gifSRC, delayEnter, delayExit) {
    var action = document.createElement("img");
    action.src = gifSRC;

    setTimeout(function () {
        document.body.appendChild(action);
    }, delayEnter);

    setTimeout(function () {
        document.body.removeChild(action);
    }, delayExit);
}

function showImage(imgSRC, delayEnter, delayExit){
    var action = document.createElement("interface");
    action.src = imgSRC;

    setTimeout(function () {
        document.body.appendChild(action);
    }, delayEnter);

    setTimeout(function () {
        document.body.removeChild(action);
    }, delayExit);
}

function loadModels() {
    const loader = new GLTFLoader();
    models.forEach((model) => {
        loader.load(
            model,
            function(gltf) {
                gltf.scene.scale.set(45, 45, 45);
                gltf.scene.position.set(0, -15, 0)
                gltf.scene.traverse(child => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                        // child.frustumCulled = false;
                        // child.material = defaultMaterial;
                    }
                });
                scene.add(gltf.scene);
            },
            undefined,
            function(error) {
                console.error('Error loading model:', error);
            }
        )
    })
}

function loadLights(){
    // Add Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add Directional Light
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(800, 200, 400);
    light.castShadow = true;
    // setup light frustum
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 2024; 
    light.shadow.camera.left = 512;
    light.shadow.camera.right = -512;
    light.shadow.camera.top = 512;
    light.shadow.camera.bottom = -512;
    light.shadow.mapSize.width= 8192;
    light.shadow.mapSize.height= 8192;
    scene.add(new THREE.CameraHelper(light.shadow.camera))  // helper to view frustum
    scene.add(light);

    // Add Craft Beer Model Point Lights
    const pl = new THREE.PointLight(0xffffff, 5, 200, 0.7);
    pl.position.set(300,19,112);
    pl.castShadow=true;
    scene.add(pl);
    scene.add(new THREE.PointLightHelper(pl,0.5));
    
    const pl2 = new THREE.PointLight(0xffffff, 3, 200, 0.7);
    pl2.position.set(375.5,19,112);
    pl2.castShadow=true;
    scene.add(pl2);
    scene.add(new THREE.PointLightHelper(pl2,0.5));

    // Add Sahara Stage Spotlights
    const distance = 400.0;
    const angle = Math.PI / 6.5;
    const angle2 = Math.PI / 10;
    const penumbra = 0.5;
    const decay = 0.5;

    const sl =  new THREE.SpotLight(0xFFA500, 400.0, distance, angle2, penumbra, decay);
    sl.position.set(-140,100,500);
    sl.target.position.set(-280,30,350);
    sl.castShadow=true;
    scene.add(sl);
    scene.add(sl.target);
    // scene.add(new THREE.SpotLightHelper(sl));

    const sl2 =  new THREE.SpotLight(0xFFA500, 400.0, distance, angle2, penumbra, decay);
    sl2.position.set(-10,100,300);
    sl2.target.position.set(-280,0,150);
    sl2.castShadow=true;
    scene.add(sl2);
    scene.add(sl2.target);
    // scene.add(new THREE.SpotLightHelper(sl2));

    const sl3 =  new THREE.SpotLight(0xFFAE42, 400.0, distance, angle, penumbra, decay);
    sl3.position.set(-260,100,260);
    sl3.target.position.set(250,10,550);
    sl3.castShadow=true;
    scene.add(sl3);
    scene.add(sl3.target);
    // scene.add(new THREE.SpotLightHelper(sl3));

    const sl4 =  new THREE.SpotLight(0xf2ad73, 200.0, distance, (Math.PI/3.0), 0.7, decay);
    sl4.position.set(-180,130,300);
    sl4.target.position.set(-180,0,300);
    sl4.castShadow=true;
    scene.add(sl4);
    scene.add(sl4.target);
    // scene.add(new THREE.SpotLightHelper(sl4));

    // Add Do Lab Stage Lighting
    const pl3 = new THREE.PointLight(0xffffff, 20, 200, 0.7);
    pl3.position.set(615,70,370);
    pl3.castShadow=true;
    scene.add(pl3);
    scene.add(new THREE.PointLightHelper(pl3,0.5));
}

// Check Landmark Interface

function checkLandmarkInterface(){
    // Position of Camera
    console.log(camera.position.x + ", " + camera.position.z);
    
    // Bounds of Landmarks
    const saharaMinX = -464.0, saharaMaxX = 241.0, saharaMinZ = 44, saharaMaxZ = 579;
    const wheelMinX = -501.0 , wheelMaxX= -237.0, wheelMinZ= -310.0, wheelMaxZ= 21.0;
    const barnMinX = 250.0, barnMaxX = 451.0, barnMinZ = -9.0, barnMaxZ = 147.0;
    const labMinX = 250.0, labMaxX = 451.0, labMinZ = -9.0, labMaxZ = 147.0;
    
    // Checks if within bounds of Sahara Stage
    if (camera.position.x >= saharaMinX && camera.position.x <= saharaMaxX && camera.position.z >= saharaMinZ && camera.position.z <= saharaMaxZ){
        showGIF(saharaTitle, 1000, 1500);
    }

    // Checks if within bounds of Le Grande Wheel
    if (camera.position.x >= wheelMinX && camera.position.x <= wheelMaxX && camera.position.z >= wheelMinZ && camera.position.z <= wheelMaxZ){
        showGIF(wheelTitle, 1000, 1500);
    }

    // Checks if within bounds of Beer Barn
    if (camera.position.x >= barnMinX && camera.position.x <= barnMaxX && camera.position.z >= barnMinZ && camera.position.z <= barnMaxZ){
        showGIF(beerTitle, 1000, 1500);
    }
    
}

// animation
function animate() {
    requestAnimationFrame(animate);

    const time = performance.now();

    // updating controller
    if (controls.isLocked === true) {
        const delta = ( time - prevTime ) / 1000;

        velocity.x -= velocity.x * 10.0 * delta;
        velocity.z -= velocity.z * 10.0 * delta;

        direction.z = Number(moveForward) - Number(moveBackward);
        direction.x = Number(moveRight) - Number(moveLeft);
        direction.normalize(); 

        if (moveForward || moveBackward) velocity.z -= direction.z * 2000.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 2000.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);

        checkLandmarkInterface();
    }

    prevTime = time;
    renderer.render(scene, camera);
}

init();
