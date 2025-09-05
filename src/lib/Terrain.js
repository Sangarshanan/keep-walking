import * as THREE from 'three';
import { PerlinNoise } from './PerlinNoise.js';

export class Terrain {
    constructor(scene, seed = Math.random()) {
        this.scene = scene;
        this.noise = new PerlinNoise(seed);
        this.chunks = new Map();
        this.chunkSize = 32;
        this.chunkHeight = 64;
        this.loadedChunks = 0;
        this.materials = this.createMaterials();
        
        // Landscape feature settings - balanced for gameplay
        this.mountainDensity = 0.05;  // Reduced frequency for better gameplay
        this.valleyDensity = 0.08;    // Slightly more valleys than mountains
        this.mountainHeight = 70;     // Height to match cloud level (clouds at 100)
        this.valleyDepth = 40;        // Moderate valley depth
        this.featureRadius = 120;     // Larger radius for gradual slopes
        
        // Store generated features to maintain consistency
        this.landscapeFeatures = new Map();
    }

    createMaterials() {
        const grassColor = new THREE.Color(0x4a7c59);
        const stoneColor = new THREE.Color(0x8B7D6B);
        const snowColor = new THREE.Color(0xFFFFFF);
        const waterColor = new THREE.Color(0x0077be);

        return {
            grass: new THREE.MeshLambertMaterial({ color: grassColor }),
            stone: new THREE.MeshLambertMaterial({ color: stoneColor }),
            snow: new THREE.MeshLambertMaterial({ color: snowColor }),
            water: new THREE.MeshLambertMaterial({ color: waterColor, transparent: true, opacity: 0.8 })
        };
    }

    // Generate landscape features (mountains and valleys) for a region
    generateLandscapeFeatures(centerX, centerZ, radius) {
        const features = [];
        const gridSize = 30; // Check every 30 units for potential features
        
        for (let x = centerX - radius; x <= centerX + radius; x += gridSize) {
            for (let z = centerZ - radius; z <= centerZ + radius; z += gridSize) {
                const featureKey = `${Math.floor(x / gridSize)},${Math.floor(z / gridSize)}`;
                
                // Skip if we've already generated this feature
                if (this.landscapeFeatures.has(featureKey)) {
                    continue;
                }
                
                // Use noise-based deterministic randomness for consistent features
                const randomValue = this.noise.noise(x * 0.003, z * 0.003, 1000);
                
                if (randomValue > 0.75) { // Increased mountain frequency (25% chance)
                    const feature = {
                        type: 'mountain',
                        x: x + (this.noise.noise(x * 0.01, z * 0.01, 2000) - 0.5) * gridSize * 0.3,
                        z: z + (this.noise.noise(x * 0.01, z * 0.01, 3000) - 0.5) * gridSize * 0.3,
                        intensity: 0.6 + Math.abs(this.noise.noise(x * 0.005, z * 0.005, 4000)) * 0.4,
                        radius: this.featureRadius * (1.2 + Math.abs(this.noise.noise(x * 0.003, z * 0.003, 5000)) * 0.8) // Larger for gradual slopes
                    };
                    this.landscapeFeatures.set(featureKey, feature);
                } else if (randomValue < -0.65) { // Slightly more valleys too (35% chance)
                    const feature = {
                        type: 'valley',
                        x: x + (this.noise.noise(x * 0.01, z * 0.01, 6000) - 0.5) * gridSize * 0.3,
                        z: z + (this.noise.noise(x * 0.01, z * 0.01, 7000) - 0.5) * gridSize * 0.3,
                        intensity: 0.5 + Math.abs(this.noise.noise(x * 0.005, z * 0.005, 8000)) * 0.4,
                        radius: this.featureRadius * (0.8 + Math.abs(this.noise.noise(x * 0.003, z * 0.003, 9000)) * 0.6)
                    };
                    this.landscapeFeatures.set(featureKey, feature);
                }
            }
        }
    }

    // Apply landscape features to modify height
    applyLandscapeFeatures(worldX, worldZ, baseHeight) {
        let modifiedHeight = baseHeight;
        
        // Check all features that might affect this position
        for (const [key, feature] of this.landscapeFeatures) {
            const distance = Math.sqrt(
                Math.pow(worldX - feature.x, 2) + 
                Math.pow(worldZ - feature.z, 2)
            );
            
            if (distance < feature.radius) {
                // More gradual falloff for smoother slopes
                const normalizedDistance = distance / feature.radius;
                const falloff = Math.pow(1 - normalizedDistance, 2); // Quadratic falloff for gradual slopes
                
                if (feature.type === 'mountain') {
                    // Add height for mountains with gradual slope and noise variation
                    const heightBoost = this.mountainHeight * feature.intensity * falloff;
                    const variation = this.noise.octaveNoise(worldX, worldZ, 3, 0.3, 0.03) * 5; // Reduced noise
                    modifiedHeight += heightBoost + variation;
                } else if (feature.type === 'valley') {
                    // Reduce height for valleys with gentle slopes
                    const heightReduction = this.valleyDepth * feature.intensity * falloff;
                    modifiedHeight -= heightReduction;
                }
            }
        }
        
        return modifiedHeight;
    }

    getChunkKey(chunkX, chunkZ) {
        return `${chunkX},${chunkZ}`;
    }

    getChunkCoords(worldX, worldZ) {
        return {
            chunkX: Math.floor(worldX / this.chunkSize),
            chunkZ: Math.floor(worldZ / this.chunkSize)
        };
    }

    generateChunk(chunkX, chunkZ) {
        const geometry = new THREE.BufferGeometry();
        const vertices = [];
        const normals = [];
        const colors = [];
        const indices = [];

        const size = this.chunkSize + 1; // +1 for proper mesh connectivity
        const heightMap = [];
        
        // Generate landscape features for this region
        const centerX = chunkX * this.chunkSize + this.chunkSize / 2;
        const centerZ = chunkZ * this.chunkSize + this.chunkSize / 2;
        this.generateLandscapeFeatures(centerX, centerZ, this.chunkSize * 2);

        // Generate height map for this chunk
        for (let z = 0; z < size; z++) {
            heightMap[z] = [];
            for (let x = 0; x < size; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;
                
                // Base terrain using multiple octaves of noise
                const baseHeight = this.noise.octaveNoise(worldX, worldZ, 6, 0.5, 0.008) * 32 + 
                                  this.noise.octaveNoise(worldX, worldZ, 4, 0.3, 0.02) * 16;
                
                // Apply landscape features (mountains and valleys)
                const finalHeight = this.applyLandscapeFeatures(worldX, worldZ, baseHeight);
                
                heightMap[z][x] = finalHeight;
            }
        }

        // Generate vertices and colors
        for (let z = 0; z < size; z++) {
            for (let x = 0; x < size; x++) {
                const worldX = chunkX * this.chunkSize + x;
                const worldZ = chunkZ * this.chunkSize + z;
                const height = heightMap[z][x];

                vertices.push(worldX, height, worldZ);

                // Color based on height - adjusted for cloud-level mountains
                let color;
                if (height < -25) {
                    color = new THREE.Color(0x000080); // Deep valley water
                } else if (height < -5) {
                    color = new THREE.Color(0x0077be); // Water
                } else if (height < 5) {
                    color = new THREE.Color(0x228b22); // Valley grass (darker green)
                } else if (height < 20) {
                    color = new THREE.Color(0x4a7c59); // Regular grass
                } else if (height < 40) {
                    color = new THREE.Color(0x8B7D6B); // Stone (foothills)
                } else if (height < 70) {
                    color = new THREE.Color(0x696969); // Dark stone (mountains)
                } else if (height < 90) {
                    color = new THREE.Color(0x778899); // Light stone (high mountains)
                } else {
                    color = new THREE.Color(0xFFFFFF); // Snow (cloud-level peaks)
                }

                colors.push(color.r, color.g, color.b);

                // Simple upward normal for now
                normals.push(0, 1, 0);
            }
        }

        // Generate indices for triangles
        for (let z = 0; z < size - 1; z++) {
            for (let x = 0; x < size - 1; x++) {
                const topLeft = z * size + x;
                const topRight = z * size + (x + 1);
                const bottomLeft = (z + 1) * size + x;
                const bottomRight = (z + 1) * size + (x + 1);

                // Two triangles per quad
                indices.push(topLeft, bottomLeft, topRight);
                indices.push(topRight, bottomLeft, bottomRight);
            }
        }

        // Calculate proper normals
        this.calculateNormals(vertices, indices, normals);

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const material = new THREE.MeshLambertMaterial({ 
            vertexColors: true,
            side: THREE.DoubleSide
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.receiveShadow = true;
        mesh.castShadow = false;

        return mesh;
    }

    calculateNormals(vertices, indices, normals) {
        // Reset normals
        for (let i = 0; i < normals.length; i++) {
            normals[i] = 0;
        }

        // Calculate face normals and accumulate vertex normals
        for (let i = 0; i < indices.length; i += 3) {
            const i1 = indices[i] * 3;
            const i2 = indices[i + 1] * 3;
            const i3 = indices[i + 2] * 3;

            const v1 = new THREE.Vector3(vertices[i1], vertices[i1 + 1], vertices[i1 + 2]);
            const v2 = new THREE.Vector3(vertices[i2], vertices[i2 + 1], vertices[i2 + 2]);
            const v3 = new THREE.Vector3(vertices[i3], vertices[i3 + 1], vertices[i3 + 2]);

            const normal = new THREE.Vector3()
                .crossVectors(v2.clone().sub(v1), v3.clone().sub(v1))
                .normalize();

            // Add to vertex normals
            normals[i1] += normal.x; normals[i1 + 1] += normal.y; normals[i1 + 2] += normal.z;
            normals[i2] += normal.x; normals[i2 + 1] += normal.y; normals[i2 + 2] += normal.z;
            normals[i3] += normal.x; normals[i3 + 1] += normal.y; normals[i3 + 2] += normal.z;
        }

        // Normalize vertex normals
        for (let i = 0; i < normals.length; i += 3) {
            const normal = new THREE.Vector3(normals[i], normals[i + 1], normals[i + 2]).normalize();
            normals[i] = normal.x;
            normals[i + 1] = normal.y;
            normals[i + 2] = normal.z;
        }
    }

    loadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        const chunk = this.generateChunk(chunkX, chunkZ);
        this.chunks.set(key, chunk);
        this.scene.add(chunk);
        this.loadedChunks++;

        return chunk;
    }

    unloadChunk(chunkX, chunkZ) {
        const key = this.getChunkKey(chunkX, chunkZ);
        const chunk = this.chunks.get(key);
        
        if (chunk) {
            this.scene.remove(chunk);
            chunk.geometry.dispose();
            this.chunks.delete(key);
            this.loadedChunks--;
        }
    }

    updateAroundPosition(playerX, playerZ, renderDistance = 3) {
        const playerChunk = this.getChunkCoords(playerX, playerZ);
        const loadedChunkKeys = new Set();

        // Load chunks around player
        for (let x = playerChunk.chunkX - renderDistance; x <= playerChunk.chunkX + renderDistance; x++) {
            for (let z = playerChunk.chunkZ - renderDistance; z <= playerChunk.chunkZ + renderDistance; z++) {
                this.loadChunk(x, z);
                loadedChunkKeys.add(this.getChunkKey(x, z));
            }
        }

        // Unload distant chunks
        for (const [key, chunk] of this.chunks) {
            if (!loadedChunkKeys.has(key)) {
                const [chunkX, chunkZ] = key.split(',').map(Number);
                this.unloadChunk(chunkX, chunkZ);
            }
        }
    }

    getHeightAt(x, z) {
        // Generate landscape features for this area if not already done
        this.generateLandscapeFeatures(x, z, 100);
        
        // Base terrain height
        const baseHeight = this.noise.octaveNoise(x, z, 6, 0.5, 0.008) * 32 + 
                          this.noise.octaveNoise(x, z, 4, 0.3, 0.02) * 16;
        
        // Apply landscape features
        return this.applyLandscapeFeatures(x, z, baseHeight);
    }

    regenerate(seed) {
        // Clear existing chunks
        for (const [key, chunk] of this.chunks) {
            this.scene.remove(chunk);
            chunk.geometry.dispose();
        }
        this.chunks.clear();
        this.loadedChunks = 0;
        
        // Clear landscape features
        this.landscapeFeatures.clear();

        // Generate new noise with new seed
        this.noise = new PerlinNoise(seed);
    }
}