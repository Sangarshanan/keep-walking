# Keep Walking 🚶‍♂️

I made this project cause after watching this really cool video https://www.youtube.com/watch?v=CSa5O6knuwI about Minecraft terrain generation, to explore Perlin noise i.e math and code to generate terrain.

<img width="1509" height="680" alt="image" src="https://github.com/user-attachments/assets/b3901ffe-eb6c-4c78-97b8-e6a33b96568d" />


Keep Walking is a browser-based 3D exploration game built with Procedural Terrain Generation using Perlin noise

## 🚀 Setup and Installation

Make sure you have Node.js installed (version 16 or higher):
```bash
node --version
npm --version
```

1. **Clone the repository**
```bash
git clone https://github.com/Sangarshanan/keep-walking.git
cd keep-walking
```

2. **Install dependencies**
```bash
npm install
```

3. **Start the development server**
```bash
npm run dev
```

4. **Open your browser**
Navigate to `http://localhost:5173` to start exploring!

### Build for Production

```bash
npm run build
```

The built files will be in the `dist/` directory.

## 🎮 How to Play

- **WASD** - Move around the world
- **Shift + WASD** - Run (faster movement)
- **Space** - Jump (multiple presses = higher jumps!)
- **Mouse** - Look around (drag to rotate camera)
- **Mouse Wheel** - Zoom in/out
- **R** - Regenerate world with new terrain and character

## 🧮 The Math Behind It

The terrain uses multiple layers of **Perlin noise:**

```javascript
// Base terrain with multiple octaves
const baseHeight = noise.octaveNoise(x, z, 6, 0.5, 0.008) * 32 + 
                  noise.octaveNoise(x, z, 4, 0.3, 0.02) * 16;

// Add landscape features (mountains/valleys)
const finalHeight = applyLandscapeFeatures(x, z, baseHeight);
```

### Landscape Features
- **Mountains**: 25% spawn chance, gradual slopes, heights up to cloud level
- **Valleys**: 35% spawn chance, smooth depressions in terrain
- **Smooth Falloff**: Quadratic interpolation for natural transitions

### Chunk-based Loading
- **32x32 unit chunks** loaded around player
- **Infinite world** generation as you explore
- **Performance optimized** with [distant chunk culling](https://modrinth.com/mod/moreculling)

## 🤝 What next

Feel free to fork this project and submit pull requests! Some ideas for contributions:

- More terrain biomes (desert, forest, ice)
- Sound effects and music
- Multiplayer support

## 📝 License

This project is released into the public domain under [The Unlicense](https://unlicense.org/).
