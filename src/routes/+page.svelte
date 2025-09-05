<script>
	import { onMount } from 'svelte';
	import Game from '../lib/Game.js';
	import PerlinNoiseVisualization from '../lib/PerlinNoiseVisualization.svelte';

	let canvas;
	let game;
	let loading = true;
	let position = { x: 0, y: 0, z: 0 };
	let chunkCount = 0;
	let isMoving = false;
	let isRunning = false;
	let jumpPower = 0;

	onMount(() => {
		game = new Game(canvas);
		game.init().then(() => {
			loading = false;
			
			// Update UI periodically
			const updateUI = () => {
				if (game.player) {
					position = {
						x: Math.round(game.player.position.x),
						y: Math.round(game.player.position.y),
						z: Math.round(game.player.position.z)
					};
					isMoving = game.player.isMoving;
					isRunning = game.player.isRunning;
					jumpPower = Math.round(game.player.currentJumpPower);
				}
				chunkCount = game.terrain ? game.terrain.loadedChunks : 0;
			};
			
			setInterval(updateUI, 100);
		});

		return () => {
			if (game) {
				game.dispose();
			}
		};
	});
</script>

{#if loading}
	<div class="loading">Loading...</div>
{/if}

<div class="ui">
	<div>Keep Walking - 3D World</div>
	<div>Position: X: {position.x}, Y: {position.y}, Z: {position.z}</div>
	<div>Chunks Loaded: {chunkCount}</div>
	<div>Status: {isRunning ? 'Running' : isMoving ? 'Walking' : 'Idle'}</div>
	<div>Jump Power: {jumpPower}</div>
</div>

<div class="controls">
	Controls: WASD to move, Hold Shift to run, Space to jump (multiple presses = higher jumps), Mouse to look around, R to regenerate world
</div>

<!-- Perlin Noise Visualization -->
<div class="noise-viz">
	<PerlinNoiseVisualization {game} {position} />
</div>

<!-- GitHub Attribution -->
<div class="attribution">
	<div class="made-with">Made with ❤️ using Svelte and Three.js</div>
	<a href="https://github.com/Sangarshanan/keep-walking" target="_blank" rel="noopener noreferrer" class="github-link">
		View on GitHub
	</a>
</div>

<canvas bind:this={canvas} id="gameCanvas"></canvas>