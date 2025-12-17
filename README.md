# Minecraft Bedrock Resource Packs (Separated)

This repository contains **two standalone Minecraft Bedrock resource packs** that can be used independently or stacked together.

## Packs

### 1) Java → Bedrock Animation Pack
**Path:** `packs/java_converted_animation_pack/`

- Converted/ported Bedrock animation assets.
- Intended to be stack-safe with other packs.

### 2) iPad Air 5 (M1) 60 FPS Optimization Pack
**Path:** `packs/ipad_air_5_optimization_pack/`

- Performance-focused pack for iPad Air 5th generation.
- Focuses on resource optimizations (textures/models/particles/config).

## How to install
You can install either pack as a folder or as a `.mcpack`.

### Folder install (iOS/iPadOS)
Copy the pack folder into:

```
/games/com.mojang/resource_packs/
```

### `.mcpack` export
1. Zip the *contents* of the pack folder (so `manifest.json` is at the zip root).
2. Rename the zip to `.mcpack`.
3. Open the `.mcpack` on the device to import into Minecraft.

## How to stack both packs (recommended)
Minecraft Bedrock lets you enable multiple resource packs and set their priority.

### Global Resources (applies to all worlds)
1. Minecraft → **Settings** → **Global Resources**
2. **My Packs**: Activate both packs.
3. Put them in any order (they are designed not to overlap). If you ever add your own edits that create conflicts, the pack **higher in the list wins**.

### Per-world Resources (recommended for testing)
1. Edit/Create a world → **Resource Packs**
2. Activate the pack(s) you want.
3. Reorder if needed.

## Independence / conflict notes
- The packs have **separate manifests** and **no dependencies**.
- The optimization pack does **not** include animation/entity overrides.
- The animation pack is isolated to animation-related files.

For pack-specific details, see each pack’s `README.md`.
