# Installation Guide — iPad Air 5 Optimization Pack (60 FPS)

## Requirements
- iPad Air 5th generation (M1) recommended
- Minecraft Bedrock 1.19.80+ (min engine version in manifest is 1.19.0)
- Some free storage space

## Install as a folder (iOS/iPadOS)
1. Copy the folder `ipad_air_5_optimization_pack/` into:

```
/games/com.mojang/resource_packs/
```

2. Open Minecraft → **Settings** → **Storage** and verify **iPad Air 5 Optimization Pack (60 FPS)** appears.

## Install as a .mcpack
1. Zip the *contents* of `ipad_air_5_optimization_pack/` (the zip root must contain `manifest.json`).
2. Rename to `iPad_Air_5_Optimization_Pack.mcpack`.
3. Open the `.mcpack` on your device to import.

## Enable the pack
You can enable it either globally or per-world.

### Global Resources
Minecraft → **Settings** → **Global Resources** → **My Packs** → Activate.

### Per-world (recommended for testing)
World settings → **Resource Packs** → Activate.

## Stacking with the animation pack
This optimization pack is designed to stack cleanly with the separate animation pack:
- `packs/java_converted_animation_pack/`

Enable both packs and (if you ever introduce overlaps) remember:
- **Higher priority packs override lower priority packs.**

## Quick verification checklist
- Pack shows in **Settings → Storage**
- No missing/invalid JSON errors reported by Minecraft
- FPS is stable in your typical worlds (try 16–20 chunk render distance)
