<script>
	import { onMount } from 'svelte';
	
	export let game = null;
	export let position = { x: 0, y: 0, z: 0 };
	
	let canvas;
	let ctx;
	let size = 120; // Size of the visualization square
	let resolution = 60; // Resolution of the noise visualization
	
	onMount(() => {
		ctx = canvas.getContext('2d');
		updateVisualization();
		
		// Update visualization periodically
		const interval = setInterval(() => {
			if (game && game.terrain) {
				updateVisualization();
			}
		}, 200); // Update every 200ms
		
		return () => clearInterval(interval);
	});
	
	function updateVisualization() {
		if (!ctx || !game || !game.terrain) return;
		
		// Clear canvas
		ctx.clearRect(0, 0, size, size);
		
		// Get terrain noise generator
		const terrain = game.terrain;
		const noise = terrain.noise;
		
		// Calculate the area around the player to visualize
		const range = 50; // Show 50 units around player in each direction
		const centerX = position.x;
		const centerZ = position.z;
		
		// Create image data
		const imageData = ctx.createImageData(resolution, resolution);
		const data = imageData.data;
		
		for (let y = 0; y < resolution; y++) {
			for (let x = 0; x < resolution; x++) {
				// Map pixel coordinates to world coordinates
				const worldX = centerX - range + (x / resolution) * (range * 2);
				const worldZ = centerZ - range + (y / resolution) * (range * 2);
				
				// Get height from terrain system (same as actual terrain generation)
				const baseHeight = noise.octaveNoise(worldX, worldZ, 6, 0.5, 0.008) * 32 + 
				                  noise.octaveNoise(worldX, worldZ, 4, 0.3, 0.02) * 16;
				
				// Apply landscape features if available
				const finalHeight = terrain.applyLandscapeFeatures ? 
					terrain.applyLandscapeFeatures(worldX, worldZ, baseHeight) : baseHeight;
				
				// Normalize height to color (from -30 to 120 range)
				const normalizedHeight = Math.max(0, Math.min(1, (finalHeight + 30) / 150));
				
				// Create color based on height (similar to terrain colors)
				let r, g, b;
				if (finalHeight < -10) {
					// Water - blue
					r = 0; g = 119; b = 190;
				} else if (finalHeight < 5) {
					// Valley grass - dark green
					r = 34; g = 139; b = 34;
				} else if (finalHeight < 20) {
					// Regular grass - green
					r = 74; g = 124; b = 89;
				} else if (finalHeight < 40) {
					// Stone - brown
					r = 139; g = 125; b = 107;
				} else if (finalHeight < 70) {
					// Mountain stone - gray
					r = 105; g = 105; b = 105;
				} else if (finalHeight < 90) {
					// High mountain - light gray
					r = 119; g = 136; b = 153;
				} else {
					// Snow - white
					r = 255; g = 255; b = 255;
				}
				
				// Set pixel color
				const index = (y * resolution + x) * 4;
				data[index] = r;     // Red
				data[index + 1] = g; // Green
				data[index + 2] = b; // Blue
				data[index + 3] = 255; // Alpha
			}
		}
		
		// Put image data on canvas
		ctx.putImageData(imageData, 0, 0);
		
		// Scale up the small image to fill the canvas
		const tempCanvas = document.createElement('canvas');
		tempCanvas.width = resolution;
		tempCanvas.height = resolution;
		const tempCtx = tempCanvas.getContext('2d');
		tempCtx.putImageData(imageData, 0, 0);
		
		ctx.clearRect(0, 0, size, size);
		ctx.imageSmoothingEnabled = false; // Pixelated look
		ctx.drawImage(tempCanvas, 0, 0, size, size);
		
		// Draw player position indicator
		const playerPixelX = size / 2;
		const playerPixelY = size / 2;
		
		ctx.fillStyle = 'red';
		ctx.beginPath();
		ctx.arc(playerPixelX, playerPixelY, 3, 0, Math.PI * 2);
		ctx.fill();
		
		// Add border
		ctx.strokeStyle = 'white';
		ctx.lineWidth = 2;
		ctx.strokeRect(1, 1, size - 2, size - 2);
		
		// Add title
		ctx.fillStyle = 'white';
		ctx.font = '10px Arial';
		ctx.fillText('Terrain Map', 5, 15);
	}
</script>

<canvas bind:this={canvas} width={size} height={size}></canvas>

<style>
	canvas {
		border: 2px solid rgba(255, 255, 255, 0.3);
		border-radius: 4px;
		background: rgba(0, 0, 0, 0.2);
	}
</style>