# TERRAit Documentation

TERRAit is a lightweight static terrain editor for quickly building editable terrain directly in the browser. It is made for fast manual sculpting, terrain blocking, heightmap export and simple mesh export.

---

## Start

Open the application through the included local webserver:

```bat
start_webserver.bat
```

Then open:

```text
http://127.0.0.1:8080/
```

The app should not be opened directly through `file://`, because browsers restrict local file access for Markdown documentation and module-style project files.

---

## Camera Controls

- **Left mouse drag:** Sculpt terrain
- **Ctrl + left mouse drag:** Pan / move viewport
- **Alt + left mouse drag:** Orbit / rotate camera
- **Alt + middle mouse drag:** Pan, Cinema-style
- **Alt + right mouse drag:** Zoom / dolly, Cinema-style
- **Mouse wheel:** Zoom
- **1 + left mouse drag:** Alternative pan
- **2 + left mouse drag:** Alternative zoom
- **3 + left mouse drag:** Alternative orbit

The shortcut overlay can be shown or hidden through **View → Control shortcuts**.

---

## Base Plane

The editor starts with a 500 × 500 meter base terrain. Use the **Base Plane Size** slider to make the footprint larger or smaller. This keeps the current height shape and scales the editable terrain area.

---

## Sculpt Tools

- **Raise:** Lifts the terrain under the brush.
- **Lower:** Pushes the terrain downward.
- **Smooth:** Softens harsh height transitions.
- **Plateau:** Pulls terrain toward the configured plateau height.
- **Noise:** Adds organic surface variation.
- **Peak:** Creates sharper mountain-like peaks.
- **River:** Cuts a narrow channel into the terrain.
- **Valley:** Creates broad depressions.
- **Erosion:** Wears down and blends details slightly.
- **Relief:** Adds subtle surface structure.
- **Sharpen:** Increases local edge contrast.
- **Flatten:** Levels the selected brush area toward its local average height.

---

## Extras

**Random Terrain** generates a complete procedural terrain once. It is intentionally separated from the sculpt tools and does not remain selected.

---

## Geometry

The tessellation slider controls how many subdivisions the terrain mesh has. More detail gives smoother sculpting and exports, but it is heavier for the browser. Use **More Detail** and **Less Detail** for quick resampling.

---

## View Options

The view panel controls editor-only visualization features:

- Wireframe overlay
- Grid helper
- Fog on/off
- Height meter
- Distance readout
- Brush cursor ring
- Control shortcuts overlay

The viewport tuning sliders control brightness, light temperature and fog density. Use light temperature to move the scene from cool blue lighting toward neutral white lighting.

---

## Import / Export

- `.terrait` stores the editable project.
- Plane-like `.obj` files can be imported as editable terrain.
- OBJ export creates a mesh file.
- STL export creates an ASCII STL mesh.
- 16-bit PNG heightmap export creates high precision grayscale height data.

## Offline Notes

TERRAit V1.1.5 contains local UI vendor files and local font files. No external CDN is required to start the editor.

---

### © complicatiion aka sksdesign · 2026 

---


