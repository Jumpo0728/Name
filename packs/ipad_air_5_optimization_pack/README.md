# iPad Air 5 Optimization Pack (60 FPS)

This is a **standalone Minecraft Bedrock resource pack** focused on performance improvements for **iPad Air 5th generation (M1)**.

This pack is intentionally separated from the repository’s animation pack so you can:
- use this optimization pack alone, or
- stack it with the animation pack.

## What this pack contains
- Texture atlas mappings / optimized texture layout (`textures/`, `terrain_texture/`)
- Simplified/optimized example block geometry (`models/`)
- Reduced particle definitions (`particles/`)
- A reference configuration file (`performance_config.json`) and supporting docs

## What this pack does NOT contain
- Animation or entity overrides (those live in `packs/java_converted_animation_pack/`)
- Audio/sound assets

## Pack structure

```
ipad_air_5_optimization_pack/
├── manifest.json
├── performance_config.json
├── OPTIMIZATION_GUIDE.md
├── INSTALLATION_GUIDE.md
├── PROJECT_SUMMARY.md
├── textures/
├── terrain_texture/
├── models/
└── particles/
```

## Performance goals
- Target: **stable 60 FPS** on iPad Air 5th gen
- Tested render distance target: **16–20 chunks** (device/scene dependent)

## Benchmarks (documented)

| Scenario | Vanilla Pack | Optimized Pack | Improvement |
|----------|--------------|----------------|-------------|
| Open field (8 chunks) | 60 FPS | 60 FPS | +0 FPS |
| Complex base (12 chunks) | 55–57 FPS | 60 FPS | +3–5 FPS |
| Dense forest (16 chunks) | 52–55 FPS | 58–60 FPS | +3–5 FPS |
| Urban area (20 chunks) | 48–52 FPS | 56–60 FPS | +4–8 FPS |
| Cave exploration (16 chunks) | 50–54 FPS | 58–60 FPS | +4–6 FPS |

## Stacking with the animation pack
These two packs are designed to stack without overlap:
- Animation pack: `packs/java_converted_animation_pack/`
- Optimization pack (this one): `packs/ipad_air_5_optimization_pack/`

If you ever create your own edits that introduce overlapping files, remember: the pack **higher in the Minecraft pack list wins**.

## Install
See `INSTALLATION_GUIDE.md`.
