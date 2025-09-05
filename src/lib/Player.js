import * as THREE from 'three';

export class Player {
    constructor(scene, terrain) {
        this.scene = scene;
        this.terrain = terrain;
        this.mesh = null;
        this.position = new THREE.Vector3(0, 0, 0);
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.walkSpeed = 50;  // Much faster walking speed
        this.runSpeed = 100;  // Very fast running speed
        this.currentSpeed = this.walkSpeed;
        this.baseJumpPower = 12;
        this.currentJumpPower = this.baseJumpPower;
        this.jumpMultiplier = 1.5;
        this.maxJumpPower = 200;
        this.jumpChargeTime = 0;
        this.gravity = -25;
        this.maxJumpHeight = 120;  // Maximum height player can reach
        this.cloudHeight = 100;    // Height where clouds appear
        this.isGrounded = false;
        this.canJump = true;
        this.isMoving = false;
        this.isRunning = false;
        this.boundingBox = new THREE.Box3();
        this.animationTime = 0;
        this.lastDirection = new THREE.Vector3(0, 0, 1);
        
        // References to body parts for animation
        this.bodyParts = {
            leftLeg: null,
            rightLeg: null,
            leftArm: null,
            rightArm: null
        };
        
        this.createRandomCharacter();
        this.setupPhysics();
    }

    createRandomCharacter() {
        const group = new THREE.Group();

        // Generate random alien colors - more vibrant and otherworldly
        const alienSkinColors = [0x9370db, 0x00ced1, 0xff6347, 0x32cd32, 0xffd700, 0xff69b4, 0x8a2be2, 0x00ff7f];
        const alienBodyColors = [0x4169e1, 0xff4500, 0x8b008b, 0x228b22, 0xdc143c, 0x00bfff, 0xff1493, 0x7fff00];
        const alienLegColors = [0x2f4f4f, 0x8b0000, 0x006400, 0x4b0082, 0xb22222, 0x008b8b, 0x9400d3, 0x556b2f];
        const hornColors = [0x000000, 0x8b4513, 0xdaa520, 0xff4500, 0x8a2be2, 0x2f4f4f, 0xdc143c];

        const skinColor = alienSkinColors[Math.floor(Math.random() * alienSkinColors.length)];
        const bodyColor = alienBodyColors[Math.floor(Math.random() * alienBodyColors.length)];
        const legColor = alienLegColors[Math.floor(Math.random() * alienLegColors.length)];
        const hornColor = hornColors[Math.floor(Math.random() * hornColors.length)];

        // Alien Head - larger and more elongated
        const headGeometry = new THREE.BoxGeometry(1.2, 1.4, 1.2);
        const headMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const head = new THREE.Mesh(headGeometry, headMaterial);
        head.position.y = 1.7;
        head.castShadow = true;
        group.add(head);

        // Alien Horns - random horn type
        const hornTypes = ['cone', 'spike', 'crystal', 'curved'];
        const hornType = hornTypes[Math.floor(Math.random() * hornTypes.length)];
        const hornMaterial = new THREE.MeshLambertMaterial({ color: hornColor });
        
        if (hornType === 'cone') {
            const hornGeometry = new THREE.ConeGeometry(0.15, 0.8, 6);
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-0.4, 2.4, 0);
            leftHorn.castShadow = true;
            group.add(leftHorn);
            
            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(0.4, 2.4, 0);
            rightHorn.castShadow = true;
            group.add(rightHorn);
        } else if (hornType === 'spike') {
            const hornGeometry = new THREE.CylinderGeometry(0.08, 0.15, 1, 6);
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-0.3, 2.5, 0);
            leftHorn.castShadow = true;
            group.add(leftHorn);
            
            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(0.3, 2.5, 0);
            rightHorn.castShadow = true;
            group.add(rightHorn);
        } else if (hornType === 'crystal') {
            const hornGeometry = new THREE.OctahedronGeometry(0.2);
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-0.35, 2.3, 0);
            leftHorn.scale.set(1, 2, 1);
            leftHorn.castShadow = true;
            group.add(leftHorn);
            
            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(0.35, 2.3, 0);
            rightHorn.scale.set(1, 2, 1);
            rightHorn.castShadow = true;
            group.add(rightHorn);
        } else { // curved
            const hornGeometry = new THREE.CylinderGeometry(0.1, 0.12, 0.7, 8);
            const leftHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            leftHorn.position.set(-0.4, 2.2, 0);
            leftHorn.rotation.z = 0.3;
            leftHorn.castShadow = true;
            group.add(leftHorn);
            
            const rightHorn = new THREE.Mesh(hornGeometry, hornMaterial);
            rightHorn.position.set(0.4, 2.2, 0);
            rightHorn.rotation.z = -0.3;
            rightHorn.castShadow = true;
            group.add(rightHorn);
        }

        // Alien Body - more abstract shape
        const bodyShapes = ['cylinder', 'diamond', 'capsule'];
        const bodyShape = bodyShapes[Math.floor(Math.random() * bodyShapes.length)];
        const bodyMaterial = new THREE.MeshLambertMaterial({ color: bodyColor });
        
        let body;
        if (bodyShape === 'cylinder') {
            const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.4, 1.2, 8);
            body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        } else if (bodyShape === 'diamond') {
            const bodyGeometry = new THREE.OctahedronGeometry(0.6);
            body = new THREE.Mesh(bodyGeometry, bodyMaterial);
            body.scale.set(1, 1.5, 0.7);
        } else { // capsule
            const bodyGeometry = new THREE.CapsuleGeometry(0.4, 0.8, 4, 8);
            body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        }
        
        body.position.y = 0.6;
        body.castShadow = true;
        group.add(body);

        // Alien Arms - tentacle-like or segmented
        const armMaterial = new THREE.MeshLambertMaterial({ color: skinColor });
        const armTypes = ['tentacle', 'segmented'];
        const armType = armTypes[Math.floor(Math.random() * armTypes.length)];
        
        if (armType === 'tentacle') {
            const armGeometry = new THREE.CylinderGeometry(0.12, 0.18, 1, 6);
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-0.65, 0.6, 0);
            leftArm.castShadow = true;
            this.bodyParts.leftArm = leftArm;
            group.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(0.65, 0.6, 0);
            rightArm.castShadow = true;
            this.bodyParts.rightArm = rightArm;
            group.add(rightArm);
        } else {
            const armGeometry = new THREE.BoxGeometry(0.25, 1, 0.25);
            const leftArm = new THREE.Mesh(armGeometry, armMaterial);
            leftArm.position.set(-0.65, 0.6, 0);
            leftArm.castShadow = true;
            this.bodyParts.leftArm = leftArm;
            group.add(leftArm);

            const rightArm = new THREE.Mesh(armGeometry, armMaterial);
            rightArm.position.set(0.65, 0.6, 0);
            rightArm.castShadow = true;
            this.bodyParts.rightArm = rightArm;
            group.add(rightArm);
        }

        // Alien Legs - different shapes
        const legMaterial = new THREE.MeshLambertMaterial({ color: legColor });
        const legTypes = ['thick', 'thin', 'hooves'];
        const legType = legTypes[Math.floor(Math.random() * legTypes.length)];
        
        if (legType === 'thick') {
            const legGeometry = new THREE.CylinderGeometry(0.2, 0.25, 1, 8);
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-0.25, -0.5, 0);
            leftLeg.castShadow = true;
            this.bodyParts.leftLeg = leftLeg;
            group.add(leftLeg);

            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(0.25, -0.5, 0);
            rightLeg.castShadow = true;
            this.bodyParts.rightLeg = rightLeg;
            group.add(rightLeg);
        } else if (legType === 'thin') {
            const legGeometry = new THREE.CylinderGeometry(0.1, 0.15, 1, 6);
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-0.2, -0.5, 0);
            leftLeg.castShadow = true;
            this.bodyParts.leftLeg = leftLeg;
            group.add(leftLeg);

            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(0.2, -0.5, 0);
            rightLeg.castShadow = true;
            this.bodyParts.rightLeg = rightLeg;
            group.add(rightLeg);
        } else { // hooves
            const legGeometry = new THREE.CylinderGeometry(0.15, 0.3, 1, 4);
            const leftLeg = new THREE.Mesh(legGeometry, legMaterial);
            leftLeg.position.set(-0.2, -0.5, 0);
            leftLeg.castShadow = true;
            this.bodyParts.leftLeg = leftLeg;
            group.add(leftLeg);

            const rightLeg = new THREE.Mesh(legGeometry, legMaterial);
            rightLeg.position.set(0.2, -0.5, 0);
            rightLeg.castShadow = true;
            this.bodyParts.rightLeg = rightLeg;
            group.add(rightLeg);
        }

        // Tamil Character on Face - replaces eyes
        const tamilChars = ['அ', 'ஆ', 'இ', 'ஈ', 'உ', 'ஊ', 'எ', 'ஏ', 'ஐ', 'ஒ', 'ஓ', 'ஔ', 'க', 'ங', 'ச', 'ஜ', 'ஞ', 'ட', 'ண', 'த', 'ந', 'ப', 'ம', 'ய', 'ர', 'ல', 'வ', 'ழ', 'ள', 'ற', 'ன'];
        const tamilChar = tamilChars[Math.floor(Math.random() * tamilChars.length)];
        const charColors = [0x000000, 0xff0000, 0x0000ff, 0x8b4513, 0x8b008b, 0x2f4f4f, 0x006400];
        const charColor = charColors[Math.floor(Math.random() * charColors.length)];
        
        // Create canvas texture with Tamil character
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Clear canvas
        context.fillStyle = 'rgba(0,0,0,0)';
        context.fillRect(0, 0, 128, 128);
        
        // Draw Tamil character
        context.fillStyle = `#${charColor.toString(16).padStart(6, '0')}`;
        context.font = 'bold 80px Arial'; // Fallback font that can display Tamil
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(tamilChar, 64, 64);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const charMaterial = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            alphaTest: 0.1
        });
        
        // Create plane geometry for the character
        const charGeometry = new THREE.PlaneGeometry(0.8, 0.8);
        const charMesh = new THREE.Mesh(charGeometry, charMaterial);
        charMesh.position.set(0, 1.8, 0.61); // Centered on face, slightly forward
        charMesh.castShadow = false; // Prevent shadow casting issues
        group.add(charMesh);

        this.mesh = group;
        // Set initial rotation to face away from camera
        this.mesh.rotation.y = Math.PI;
        this.scene.add(this.mesh);

        // Set initial position
        this.spawnAtRandomLocation();
    }

    spawnAtRandomLocation() {
        // Generate random spawn location
        const x = (Math.random() - 0.5) * 100;
        const z = (Math.random() - 0.5) * 100;
        const y = this.terrain.getHeightAt(x, z) + 5;

        this.position.set(x, y, z);
        this.mesh.position.copy(this.position);
    }

    setupPhysics() {
        // Update bounding box
        this.updateBoundingBox();
    }

    updateBoundingBox() {
        const size = new THREE.Vector3(0.8, 2, 0.8);
        this.boundingBox.setFromCenterAndSize(this.position, size);
    }

    checkGrounded() {
        // Check if player is on ground
        const groundHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
        const wasGrounded = this.isGrounded;
        const minPlayerHeight = groundHeight + 1; // Player must always be at least 1 unit above terrain
        
        // Prevent character from going below terrain surface
        if (this.position.y < minPlayerHeight) {
            this.position.y = minPlayerHeight;
            this.velocity.y = Math.max(0, this.velocity.y); // Stop downward velocity
        }
        
        this.isGrounded = this.position.y <= groundHeight + 1.1;
        
        if (this.isGrounded && this.velocity.y <= 0) {
            this.position.y = minPlayerHeight;
            this.velocity.y = 0;
            
            // Reset jump power when landing
            if (!wasGrounded) {
                this.resetJumpPower();
            }
        }
    }

    jump() {
        // Allow jumping anytime, but not above max height
        if (this.canJump && this.position.y < this.maxJumpHeight) {
            this.velocity.y = Math.max(this.velocity.y, 0) + this.currentJumpPower;
            this.currentJumpPower = Math.min(this.currentJumpPower * this.jumpMultiplier, this.maxJumpPower);
            this.isGrounded = false;
            this.canJump = false;
            
            // Reset jump availability after a short delay
            setTimeout(() => {
                this.canJump = true;
            }, 100);
        }
    }

    resetJumpPower() {
        this.currentJumpPower = this.baseJumpPower;
    }

    autoJump(heightDiff) {
        // Auto-jump with just enough power to clear the obstacle
        if (this.canJump && this.isGrounded) {
            // Calculate required jump power based on height difference
            const requiredPower = Math.max(this.baseJumpPower, heightDiff * 2 + 5);
            this.velocity.y = Math.max(this.velocity.y, 0) + requiredPower;
            this.isGrounded = false;
            this.canJump = false;
            
            // Reset jump availability after a short delay
            setTimeout(() => {
                this.canJump = true;
            }, 200); // Slightly longer delay for auto-jumps
        }
    }

    move(direction, deltaTime, isRunning = false) {
        this.isMoving = direction.length() > 0;
        this.isRunning = isRunning && this.isMoving;
        
        // Set speed based on running state
        this.currentSpeed = this.isRunning ? this.runSpeed : this.walkSpeed;
        
        if (this.isMoving) {
            // Store direction for rotation
            this.lastDirection.copy(direction);
            
            // Rotate character to face movement direction (add PI to face away from camera)
            const angle = Math.atan2(direction.x, direction.z) + Math.PI;
            this.mesh.rotation.y = angle;
            
            // Apply movement with collision detection
            const moveVector = direction.clone().multiplyScalar(this.currentSpeed * deltaTime);
            const newPosition = this.position.clone().add(moveVector);
            
            // Check if new position would be inside terrain (collision detection)
            const terrainHeight = this.terrain.getHeightAt(newPosition.x, newPosition.z);
            const playerBottomHeight = newPosition.y - 1; // Player height offset
            const minValidHeight = terrainHeight + 1; // Minimum valid player position
            
            // Only allow movement if player bottom is above terrain
            if (playerBottomHeight >= terrainHeight - 0.5) { // Small tolerance for slope walking
                this.position.copy(newPosition);
                // Ensure player is never below terrain surface
                if (this.position.y < minValidHeight) {
                    this.position.y = minValidHeight;
                }
            } else {
                // Calculate height difference for auto-jump
                const heightDiff = terrainHeight - playerBottomHeight;
                
                // If obstacle is jumpable height (less than 8 units) and player is grounded, auto-jump
                if (heightDiff <= 8 && this.isGrounded && this.canJump) {
                    this.autoJump(heightDiff);
                    this.position.copy(newPosition); // Allow movement since we're jumping
                } else {
                    // Try sliding along terrain if blocked and can't auto-jump
                    // Try X movement only
                    const xOnlyPos = this.position.clone().add(new THREE.Vector3(moveVector.x, 0, 0));
                    const xTerrainHeight = this.terrain.getHeightAt(xOnlyPos.x, xOnlyPos.z);
                    const xHeightDiff = xTerrainHeight - (xOnlyPos.y - 1);
                    
                    if (xHeightDiff <= 0.5) {
                        this.position.x = xOnlyPos.x;
                        // Ensure minimum height
                        if (this.position.y < xTerrainHeight + 1) {
                            this.position.y = xTerrainHeight + 1;
                        }
                    } else if (xHeightDiff <= 8 && this.isGrounded && this.canJump) {
                        this.autoJump(xHeightDiff);
                        this.position.x = xOnlyPos.x;
                    } else {
                        // Try Z movement only
                        const zOnlyPos = this.position.clone().add(new THREE.Vector3(0, 0, moveVector.z));
                        const zTerrainHeight = this.terrain.getHeightAt(zOnlyPos.x, zOnlyPos.z);
                        const zHeightDiff = zTerrainHeight - (zOnlyPos.y - 1);
                        
                        if (zHeightDiff <= 0.5) {
                            this.position.z = zOnlyPos.z;
                            // Ensure minimum height
                            if (this.position.y < zTerrainHeight + 1) {
                                this.position.y = zTerrainHeight + 1;
                            }
                        } else if (zHeightDiff <= 8 && this.isGrounded && this.canJump) {
                            this.autoJump(zHeightDiff);
                            this.position.z = zOnlyPos.z;
                        }
                    }
                }
            }
        }

        // Apply gravity
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
        }
        
        this.position.y += this.velocity.y * deltaTime;

        // Check ground collision
        this.checkGrounded();

        // Update mesh position and animations
        this.mesh.position.copy(this.position);
        this.updateAnimations(deltaTime);
        this.updateBoundingBox();
    }

    updateAnimations(deltaTime) {
        if (this.isMoving) {
            // Update animation time
            const animationSpeed = this.isRunning ? 10 : 6;
            this.animationTime += deltaTime * animationSpeed;
            
            // Walking animation - swing legs and arms
            const legSwing = Math.sin(this.animationTime) * 0.3;
            const armSwing = Math.sin(this.animationTime) * 0.2;
            
            if (this.bodyParts.leftLeg) {
                this.bodyParts.leftLeg.rotation.x = legSwing;
            }
            if (this.bodyParts.rightLeg) {
                this.bodyParts.rightLeg.rotation.x = -legSwing;
            }
            if (this.bodyParts.leftArm) {
                this.bodyParts.leftArm.rotation.x = -armSwing;
            }
            if (this.bodyParts.rightArm) {
                this.bodyParts.rightArm.rotation.x = armSwing;
            }
        } else {
            // Reset to idle position when not moving
            if (this.bodyParts.leftLeg) {
                this.bodyParts.leftLeg.rotation.x = THREE.MathUtils.lerp(this.bodyParts.leftLeg.rotation.x, 0, deltaTime * 5);
            }
            if (this.bodyParts.rightLeg) {
                this.bodyParts.rightLeg.rotation.x = THREE.MathUtils.lerp(this.bodyParts.rightLeg.rotation.x, 0, deltaTime * 5);
            }
            if (this.bodyParts.leftArm) {
                this.bodyParts.leftArm.rotation.x = THREE.MathUtils.lerp(this.bodyParts.leftArm.rotation.x, 0, deltaTime * 5);
            }
            if (this.bodyParts.rightArm) {
                this.bodyParts.rightArm.rotation.x = THREE.MathUtils.lerp(this.bodyParts.rightArm.rotation.x, 0, deltaTime * 5);
            }
        }
    }

    update(deltaTime) {
        // Apply gravity and update position even when not moving
        this.checkGrounded();
        
        if (!this.isGrounded) {
            this.velocity.y += this.gravity * deltaTime;
            this.position.y += this.velocity.y * deltaTime;
            
            // Enforce maximum height limit
            if (this.position.y > this.maxJumpHeight) {
                this.position.y = this.maxJumpHeight;
                this.velocity.y = Math.min(this.velocity.y, 0); // Stop upward movement
            }
            
            // Safety check: ensure player never goes below terrain surface
            const currentTerrainHeight = this.terrain.getHeightAt(this.position.x, this.position.z);
            const minHeight = currentTerrainHeight + 1;
            if (this.position.y < minHeight) {
                this.position.y = minHeight;
                this.velocity.y = Math.max(0, this.velocity.y);
                this.isGrounded = true;
            }
            
            this.mesh.position.copy(this.position);
            this.updateBoundingBox();
        }
    }

    regenerateAppearance() {
        // Remove old mesh
        this.scene.remove(this.mesh);
        
        // Reset animation properties
        this.animationTime = 0;
        this.isMoving = false;
        this.isRunning = false;
        
        // Create new random character
        this.createRandomCharacter();
    }
}