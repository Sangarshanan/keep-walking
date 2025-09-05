import * as THREE from 'three';
import { Terrain } from './Terrain.js';
import { Player } from './Player.js';
import { ThirdPersonCamera } from './Camera.js';
import { CloudSystem } from './Clouds.js';

export default class Game {
    constructor(canvas) {
        this.canvas = canvas;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.terrain = null;
        this.player = null;
        this.cameraController = null;
        this.clouds = null;
        this.cloudGenerationTimer = 0;
        this.clock = new THREE.Clock();
        this.keys = {};
        
        this.setupEventListeners();
    }

    async init() {
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLighting();
        
        // Generate random seed for terrain and spawn
        const seed = Math.random();
        this.terrain = new Terrain(this.scene, seed);
        
        // Create player with random appearance
        this.player = new Player(this.scene, this.terrain);
        
        // Create cloud system
        this.clouds = new CloudSystem(this.scene);
        
        // Setup camera controller
        this.cameraController = new ThirdPersonCamera(this.camera, this.player);
        
        // Load initial terrain around player
        this.terrain.updateAroundPosition(this.player.position.x, this.player.position.z);
        
        this.animate();
    }

    setupScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x87CEEB); // Sky blue
        this.scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
    }

    setupCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
    }

    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas,
            antialias: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        
        // Shadow settings
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 200;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        
        this.scene.add(directionalLight);

        // Helper to visualize shadow camera (remove in production)
        // const helper = new THREE.CameraHelper(directionalLight.shadow.camera);
        // this.scene.add(helper);
    }

    setupEventListeners() {
        // Keyboard events
        document.addEventListener('keydown', (event) => {
            this.keys[event.code.toLowerCase()] = true;
            
            // Handle special keys
            if (event.code === 'Space') {
                event.preventDefault();
                if (this.player) {
                    this.player.jump();
                }
            }
            
            if (event.code === 'KeyR') {
                this.regenerateWorld();
            }
        });

        document.addEventListener('keyup', (event) => {
            this.keys[event.code.toLowerCase()] = false;
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    handleMovement(deltaTime) {
        if (!this.player || !this.cameraController) return;

        const moveDirection = new THREE.Vector3();
        const forward = this.cameraController.getForwardDirection();
        const right = this.cameraController.getRightDirection();

        // WASD movement relative to camera direction
        if (this.keys['keyw']) {
            moveDirection.add(forward);
        }
        if (this.keys['keys']) {
            moveDirection.sub(forward);
        }
        if (this.keys['keya']) {
            moveDirection.sub(right);
        }
        if (this.keys['keyd']) {
            moveDirection.add(right);
        }

        // Check if running (Shift key pressed)
        const isRunning = this.keys['shiftleft'] || this.keys['shiftright'];

        // Always call move method to update movement state
        if (moveDirection.length() > 0) {
            moveDirection.normalize();
        }
        this.player.move(moveDirection, deltaTime, isRunning);

        // Always update player physics
        this.player.update(deltaTime);
    }

    update(deltaTime) {
        this.handleMovement(deltaTime);
        
        if (this.cameraController) {
            this.cameraController.update();
        }
        
        if (this.terrain && this.player) {
            // Update terrain chunks around player
            this.terrain.updateAroundPosition(this.player.position.x, this.player.position.z);
        }
        
        if (this.clouds) {
            // Update cloud animations
            this.clouds.update(deltaTime);
            
            // Update cloud transparency based on player proximity
            this.clouds.updateCloudTransparency(this.player.position);
            
            // Only generate new clouds occasionally to maintain sparse distribution
            this.cloudGenerationTimer += deltaTime;
            if (this.cloudGenerationTimer > 10) { // Every 10 seconds
                this.clouds.generateCloudsAroundPosition(this.player.position.x, this.player.position.z);
                this.cloudGenerationTimer = 0;
            }
            
            // Cull distant clouds
            this.clouds.cullDistantClouds(this.player.position);
        }
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        
        const deltaTime = this.clock.getDelta();
        this.update(deltaTime);
        this.render();
    }

    regenerateWorld() {
        if (this.terrain && this.player) {
            const newSeed = Math.random();
            this.terrain.regenerate(newSeed);
            this.player.regenerateAppearance();
            this.player.spawnAtRandomLocation();
            this.terrain.updateAroundPosition(this.player.position.x, this.player.position.z);
            
            // Regenerate clouds too
            if (this.clouds) {
                this.clouds.dispose();
                this.clouds = new CloudSystem(this.scene);
            }
        }
    }

    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        // Clean up geometries and materials
        this.scene.traverse((object) => {
            if (object.geometry) {
                object.geometry.dispose();
            }
            if (object.material) {
                if (Array.isArray(object.material)) {
                    object.material.forEach(material => material.dispose());
                } else {
                    object.material.dispose();
                }
            }
        });
    }
}