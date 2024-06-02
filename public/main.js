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

const playSVG = "public/assets/play_circle_24dp_FILL0_wght400_GRAD0_opsz24.svg";
const pauseSVG = "public/assets/pause_circle_24dp_FILL0_wght400_GRAD0_opsz24.svg";
const nextSVG = "public/assets/skip_next_24dp_FILL0_wght400_GRAD0_opsz24.svg";
const prevSVG = "public/assets/skip_previous_24dp_FILL0_wght400_GRAD0_opsz24.svg";

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

    // Add Ambient Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add Directional Light
    const light = new THREE.DirectionalLight(0xffffff, 2.5);
    light.position.set(200, 200, 200);
    light.castShadow = true;
    // setup light frustum
    light.shadow.camera.near = 0.1;
    light.shadow.camera.far = 1024; 
    light.shadow.camera.left = 512;
    light.shadow.camera.right = -512;
    light.shadow.camera.top = 512;
    light.shadow.camera.bottom = -512;
    light.shadow.mapSize.width= 8192;
    light.shadow.mapSize.height= 8192;
    scene.add(new THREE.CameraHelper(light.shadow.camera))  // helper to view frustum
    scene.add(light);

    // Add Craft Beer Model Point Lights
    const pl = new THREE.PointLight(0xffffff, 1, 200, 0.9);
    pl.position.set(2.5,19,9.5);
    pl.castShadow=true;
    scene.add(pl);
    scene.add(new THREE.PointLightHelper(pl,0.5));
    
    const pl2 = new THREE.PointLight(0xffffff, 1, 200, 0.9);
    pl2.position.set(2.5,19,85);
    pl2.castShadow=true;
    scene.add(pl2);
    scene.add(new THREE.PointLightHelper(pl2,0.5));

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

    // Media player
    let track_list = [
        { source : "public/assets/Espresso.mp3",
         songInfo : "Espresso - Sabrina Carpenter"
        },
        { source : "public/assets/HOT TO GO!.mp3",
         songInfo : "HOT TO GO! - Chapell Roan"
        },
        { source : "public/assets/ANTIFRAGILE.mp3",
         songInfo : "ANTIFRAGILE - LE SSERAFIM"
        },
        { source : "public/assets/怪物.mp3",
         songInfo : "怪物 - YOASOBI"
        },

    ];
    let track_index = 0;
    let isPlaying = false;
    let curr_track = document.createElement("audio");
    curr_track.src = track_list[track_index].source;

    function playPauseMusic() {
        if(!isPlaying) {
            playMusic();
        
        } else pauseMusic();
    }

    function playMusic() {
        curr_track.play();
        isPlaying = true;
        showMusic(playSVG);
    }

    function pauseMusic() {
        curr_track.pause();
        isPlaying = false;
        showMusic(pauseSVG);
    }

    function nextSong() {
        if (track_index < track_list.length - 1) {
            track_index += 1;
        } else {
            track_index = 0;
        }

        curr_track.src = track_list[track_index].source;
        playMusic();

        showMusic(nextSVG);
    }

    function prevSong() {
        if (track_index > 0) {
            track_index -= 1;
        } 
        else {
            track_index = track_list.length - 1;
        }

        curr_track.src = track_list[track_index].source;
        playMusic();

        showMusic(prevSVG);
    }

    // show media controls
    function showMusic(source) {
        var mediaControl = document.createElement("img");
        mediaControl.setAttribute("id", "mediaIcon");
        mediaControl.src = source;

        var songDetails = document.createElement("text");
        songDetails.setAttribute("id", "songInfo");

        document.body.appendChild(mediaControl);
        songDetails.innerHTML = track_list[track_index].songInfo;

        var divControl = document.createElement("div");
        
        divControl.appendChild(mediaControl);
        divControl.appendChild(songDetails);
        
        divControl.setAttribute("id", "divIconSong");

        
        document.body.appendChild(divControl);
        

        setTimeout(function () {
            document.body.removeChild(divControl);
        }, 4000);
    }

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
            case 'Space':
                playPauseMusic();
                break;
            case 'KeyQ':
                prevSong();
                break;
            case 'KeyE':
                nextSong();
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

        if (moveForward || moveBackward) velocity.z -= direction.z * 400.0 * delta;
        if (moveLeft || moveRight) velocity.x -= direction.x * 400.0 * delta;

        controls.moveRight(-velocity.x * delta);
        controls.moveForward(-velocity.z * delta);
    }

    prevTime = time;
    renderer.render(scene, camera);
}



init();
