# Project Summary — iPad Air 5 Optimization Pack (60 FPS)

## Purpose
This directory is a **standalone Bedrock resource pack** focused on iPad Air 5th gen (M1) performance.

It is intentionally separated from the repository’s animation pack so the two packs can be:
- enabled independently, or
- stacked together without being merged.

## What this pack includes
- Texture atlas/mapping definitions (`textures/`, `terrain_texture/`)
- Simplified example block geometry/models (`models/`)
- Reduced particle definitions (`particles/`)
- A reference configuration file (`performance_config.json`) and documentation

## What this pack does not include
- Animations/entity overrides (moved to `packs/java_converted_animation_pack/`)
- Sound/audio assets

## Stacking verification (design-time)
The two packs are structured to avoid conflicts:
- This pack contains **no** `animations/`, `animation_controllers/`, or `entity/` overrides.
- The animation pack is isolated to animation-related folders.

As a result, Minecraft can load either pack alone or both together.

## Install
See `INSTALLATION_GUIDE.md`.
