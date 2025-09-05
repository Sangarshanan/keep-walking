import * as THREE from 'three';

export class CloudSystem {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.cloudHeight = 100;
        this.cloudCount = 25;   // Fewer clouds with lots of empty space
        
        this.createClouds();
    }

    createClouds() {
        // Cloud material - fully white and more transparent
        this.cloudMaterial = new THREE.MeshLambertMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.4  // More transparent for better visibility when inside
        });

        for (let i = 0; i < this.cloudCount; i++) {
            const cloudGroup = new THREE.Group();
            
            // Create multiple spheres with gaps for each cloud
            const sphereCount = Math.random() * 6 + 3; // 3-9 spheres per cloud (fewer for more gaps)
            
            for (let j = 0; j < sphereCount; j++) {
                const sphereSize = Math.random() * 6 + 3; // Smaller spheres: 3-9
                const sphereGeometry = new THREE.SphereGeometry(sphereSize, 8, 6);
                const sphere = new THREE.Mesh(sphereGeometry, this.cloudMaterial);
                
                // Position spheres with more spread for gaps
                sphere.position.set(
                    (Math.random() - 0.5) * 35,  // Wider spread
                    (Math.random() - 0.5) * 12,  // More vertical variation
                    (Math.random() - 0.5) * 35   // Wider spread
                );
                
                cloudGroup.add(sphere);
            }
            
            // Position clouds with much more spacing
            cloudGroup.position.set(
                (Math.random() - 0.5) * 1500, // Even wider spread: 1500x1500 area
                this.cloudHeight + (Math.random() - 0.5) * 40, // Height variation
                (Math.random() - 0.5) * 1500
            );
            
            // Random rotation for variety
            cloudGroup.rotation.y = Math.random() * Math.PI * 2;
            
            // Random scale for variety
            const scale = Math.random() * 0.8 + 0.6; // Scale between 0.6-1.4
            cloudGroup.scale.setScalar(scale);
            
            this.clouds.push(cloudGroup);
            this.scene.add(cloudGroup);
        }
    }

    // Method to generate more clouds around a position (for infinite world)
    generateCloudsAroundPosition(x, z, radius = 300) {
        const existingClouds = this.clouds.length;
        const newCloudsNeeded = 200;   // Generate very few new clouds
        
        for (let i = 0; i < newCloudsNeeded; i++) {
            const cloudGroup = new THREE.Group();
            
            const sphereCount = Math.random() * 5 + 3;
            
            for (let j = 0; j < sphereCount; j++) {
                const sphereSize = Math.random() * 6 + 3;
                const sphereGeometry = new THREE.SphereGeometry(sphereSize, 8, 6);
                const sphere = new THREE.Mesh(sphereGeometry, this.cloudMaterial);
                
                sphere.position.set(
                    (Math.random() - 0.5) * 30,  // More spread for gaps
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 30
                );
                
                cloudGroup.add(sphere);
            }
            
            // Position new clouds far apart around the player
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * radius + 100; // Ensure minimum distance
            cloudGroup.position.set(
                x + Math.cos(angle) * distance,
                this.cloudHeight + (Math.random() - 0.5) * 20,
                z + Math.sin(angle) * distance
            );
            
            cloudGroup.rotation.y = Math.random() * Math.PI * 2;
            const scale = Math.random() * 0.8 + 0.6;
            cloudGroup.scale.setScalar(scale);
            
            this.clouds.push(cloudGroup);
            this.scene.add(cloudGroup);
        }
    }

    // Animate clouds slowly drifting
    update(deltaTime) {
        this.clouds.forEach(cloud => {
            // Slow drift movement
            cloud.position.x += deltaTime * 2;
            cloud.position.z += deltaTime * 1;
            
            // Slow rotation
            cloud.rotation.y += deltaTime * 0.1;
        });
    }

    // Update cloud transparency based on player proximity
    updateCloudTransparency(playerPosition) {
        this.clouds.forEach(cloud => {
            const distance = cloud.position.distanceTo(playerPosition);
            
            // Make clouds more transparent when player is very close (inside them)
            cloud.traverse((child) => {
                if (child.material && child.material.transparent) {
                    if (distance < 15) {
                        // Very close - almost fully transparent with white haze
                        child.material.opacity = 0.1;
                    } else if (distance < 30) {
                        // Close - semi-transparent
                        child.material.opacity = 0.2;
                    } else {
                        // Far - normal transparency
                        child.material.opacity = 0.4;
                    }
                }
            });
        });
    }

    // Clean up distant clouds for performance
    cullDistantClouds(playerPosition, maxDistance = 500) {
        for (let i = this.clouds.length - 1; i >= 0; i--) {
            const cloud = this.clouds[i];
            const distance = cloud.position.distanceTo(playerPosition);
            
            if (distance > maxDistance) {
                this.scene.remove(cloud);
                
                // Dispose geometries and materials
                cloud.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
                
                this.clouds.splice(i, 1);
            }
        }
    }

    dispose() {
        this.clouds.forEach(cloud => {
            this.scene.remove(cloud);
            cloud.traverse((child) => {
                if (child.geometry) child.geometry.dispose();
                if (child.material) child.material.dispose();
            });
        });
        this.clouds = [];
    }
}