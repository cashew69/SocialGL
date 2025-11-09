# SocialGL

A modern social media frontend featuring interactive WebGL posts. Built with vanilla JavaScript, HTML, and CSS - no frameworks required.

## Features

- **WebGL Posts**: Share and view interactive 3D graphics in your social feed
- **Multiple Scenes**: Choose from 4 different WebGL scenes:
  - 🎲 Rotating Cube - Colorful spinning cube
  - 🌐 Glowing Sphere - Pulsing sphere with dynamic lighting
  - ✨ Particles - Mesmerizing particle system
  - 🌊 Wave Grid - Animated wave simulation
- **Real-time Rendering**: Smooth 60fps WebGL animations
- **Responsive Design**: Works on desktop and mobile devices
- **Social Features**: Like, share, and interact with posts
- **Clean Architecture**: Simple, maintainable codebase

## Quick Start

1. Clone the repository
2. Open `index.html` in a modern web browser
3. That's it! No build process or dependencies needed

## Browser Support

Requires a browser with WebGL support:
- Chrome 56+
- Firefox 51+
- Safari 11+
- Edge 79+

## File Structure

```
SocialGL/
├── index.html          # Main HTML structure
├── styles.css          # All styling (responsive, modern design)
├── app.js              # Social media functionality
├── webgl-renderer.js   # WebGL rendering engine
└── README.md          # This file
```

## Usage

### Viewing the Feed

The feed displays WebGL posts with real-time 3D graphics. Each post includes:
- Author information
- Interactive WebGL canvas
- Caption
- Like and share buttons
- Timestamp

### Creating Posts

1. Click the "Create" button in the navigation
2. Enter a caption (optional)
3. Select a WebGL scene type
4. Preview the scene in real-time
5. Click "Post to Feed" to share

### Interacting with Posts

- **Like**: Click the heart icon to like/unlike a post
- **Share**: Click the share button to copy the post link

## Technical Details

### WebGL Renderer

The `WebGLRenderer` class provides a clean API for rendering different 3D scenes:

```javascript
const renderer = new WebGLRenderer(canvas);
renderer.initScene('cube'); // 'cube', 'sphere', 'particles', or 'wave'
```

Each scene is self-contained with its own shaders, geometry, and animation logic.

### Performance

- Efficient rendering with RequestAnimationFrame
- Proper cleanup and memory management
- Minimal DOM manipulation
- Optimized shader code

### Maintainability

- Vanilla JavaScript - no framework dependencies
- Clean separation of concerns
- Well-commented code
- Modular architecture

## Customization

### Adding New Scenes

To add a new WebGL scene:

1. Add an `init[SceneName]()` method in `webgl-renderer.js`
2. Add a `render[SceneName]()` method
3. Update the scenes object in `initScene()`
4. Add a button in the scene selector (HTML)

### Styling

All styles are in `styles.css` using CSS custom properties for easy theming:

```css
:root {
    --primary-color: #6366f1;
    --bg-color: #0f172a;
    --surface-color: #1e293b;
    /* ... */
}
```

## License

MIT

## Contributing

Contributions welcome! This is a simple, educational project demonstrating WebGL integration in a social media context.
