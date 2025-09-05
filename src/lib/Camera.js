import * as THREE from 'three';

export class ThirdPersonCamera {
    constructor(camera, player) {
        this.camera = camera;
        this.player = player;
        this.distance = 10;
        this.height = 5;
        this.angle = 0;
        this.targetAngle = 0;
        this.mouseSensitivity = 0.001;  // Reduced mouse sensitivity for smoother rotation
        this.smoothing = 0.05;          // Slower smoothing for less jarring camera movement
        
        this.setupMouseControls();
    }

    setupMouseControls() {
        let isMouseDown = false;
        let lastMouseX = 0;
        let lastMouseY = 0;

        document.addEventListener('mousedown', (event) => {
            if (event.button === 0) { // Left mouse button
                isMouseDown = true;
                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
                document.body.style.cursor = 'grab';
            }
        });

        document.addEventListener('mouseup', (event) => {
            if (event.button === 0) {
                isMouseDown = false;
                document.body.style.cursor = 'default';
            }
        });

        document.addEventListener('mousemove', (event) => {
            if (isMouseDown) {
                const deltaX = event.clientX - lastMouseX;
                const deltaY = event.clientY - lastMouseY;

                this.targetAngle -= deltaX * this.mouseSensitivity;
                
                // Clamp vertical angle
                this.height = Math.max(2, Math.min(15, this.height - deltaY * 0.02));

                lastMouseX = event.clientX;
                lastMouseY = event.clientY;
            }
        });

        // Mouse wheel for zoom
        document.addEventListener('wheel', (event) => {
            this.distance = Math.max(5, Math.min(20, this.distance + event.deltaY * 0.01));
        });

        // Touch controls for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let isTouching = false;

        document.addEventListener('touchstart', (event) => {
            if (event.touches.length === 1) {
                isTouching = true;
                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            }
        });

        document.addEventListener('touchend', () => {
            isTouching = false;
        });

        document.addEventListener('touchmove', (event) => {
            if (isTouching && event.touches.length === 1) {
                const deltaX = event.touches[0].clientX - touchStartX;
                const deltaY = event.touches[0].clientY - touchStartY;

                this.targetAngle -= deltaX * this.mouseSensitivity;
                this.height = Math.max(2, Math.min(15, this.height - deltaY * 0.02));

                touchStartX = event.touches[0].clientX;
                touchStartY = event.touches[0].clientY;
            }
        });
    }

    update() {
        // Smooth angle interpolation (no character rotation following)
        this.angle = THREE.MathUtils.lerp(this.angle, this.targetAngle, this.smoothing);

        // Calculate camera position relative to player
        const playerPos = this.player.position;
        
        const cameraX = playerPos.x + Math.sin(this.angle) * this.distance;
        const cameraZ = playerPos.z + Math.cos(this.angle) * this.distance;
        const cameraY = playerPos.y + this.height;

        // Set camera position
        this.camera.position.set(cameraX, cameraY, cameraZ);
        
        // Make camera look at player
        this.camera.lookAt(playerPos.x, playerPos.y + 1, playerPos.z);
    }

    getForwardDirection() {
        // Get the direction the camera is facing (useful for movement)
        const forward = new THREE.Vector3();
        this.camera.getWorldDirection(forward);
        forward.y = 0; // Keep movement on horizontal plane
        forward.normalize();
        return forward;
    }

    getRightDirection() {
        // Get the right direction relative to camera
        const forward = this.getForwardDirection();
        const right = new THREE.Vector3();
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0));
        right.normalize();
        return right;
    }
}