# TERRAit Documentation

**Version:** V1.1.8  

TERRAit is a lightweight 3D terrain editor for fast manual sculpting, terrain prototyping and export workflows. This documentation is loaded from `assets/Docu.md`, so it can be edited or replaced without changing the application code.

## Start

Launch the local server with:

```bat
start_webserver.bat
```

Then open:

```text
http://127.0.0.1:8080/
```

Use the included server instead of opening `index.html` directly. Browser module imports and documentation loading work best through a local webserver.

## Controls

- **Left drag:** Sculpt terrain
- **Shift + left drag:** Invert supported brushes
- **Ctrl + left drag:** Pan / move viewport
- **Alt + left drag:** Orbit / rotate camera
- **Alt + middle drag:** Pan camera target
- **Alt + right drag:** Dolly / zoom camera
- **Mouse wheel:** Zoom
- **1 / 2 / 3 + drag:** Cinema-style pan / zoom / orbit
- **Ctrl + Z:** Undo
- **Ctrl + Y / Ctrl + Shift + Z:** Redo

The **Controls** button in the top toolbar shows these shortcuts inside the application.

## Terrain basics

A new project creates a 500 × 500 m base plane. You can resize the plane with the Base Plane slider or through the terrain size input. The editor preserves height data where possible when changing size or tessellation.

## Sculpt tools

- **Raise:** Builds up terrain.
- **Lower:** Cuts terrain downward.
- **Smooth:** Softens hard transitions.
- **Plateau:** Moves terrain toward the configured plateau height.
- **Noise:** Adds organic random variation.
- **Peak:** Creates mountain-like peaks.
- **River:** Cuts river grooves with subtle raised banks.
- **Valley:** Creates broad depressions.
- **Erosion:** Reduces harsh slopes and adds an erosion-like effect.
- **Relief:** Adds fine procedural surface detail.
- **Sharpen:** Increases local contrast and edge definition.
- **Flatten:** Pulls the area toward the brush-center height.

## History

The History panel provides classic undo and redo. Terrain-changing actions are stored as snapshots, including sculpt strokes, random generation, flattening, resizing, detail changes, project import and editable OBJ import.

## View options

The right-side View section can toggle wireframe, grid, fog, height meter, distance readout and brush cursor ring. The Viewport Tuning sliders adjust brightness, light temperature and fog density.

## Import and export

TERRAit can load `.terrait` project files and regular plane-like OBJ files as editable terrain. Non-plane OBJ, STL and FBX files can be imported as visual reference meshes.

Export options include:

- `.terrait` project file
- OBJ terrain mesh
- ASCII STL terrain mesh
- 16-bit grayscale PNG heightmap

## Offline usage

All runtime dependencies are local in the project folder. The app does not need remote CDN access for Bootstrap, Three.js, loaders, fonts or documentation.

### © complicatiion aka sksdesign · 2026 


