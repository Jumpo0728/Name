# Detailed Animations Reworked (Bedrock)

A standalone Minecraft Bedrock Edition resource pack that adds the **Detailed Animations Reworked** animation set, converted from the original Java resource pack.

## Included

- Player animations: walking, idle, attack, flying
- Block, item, particle, mob, and weather animations (see `animations/detailed_animations.json`)
- Animation controllers (`animation_controllers.json`)
- Render controllers (`render_controllers.json`) and supporting materials (`materials.json`)
- Supporting geometry (`models/geometry_detailed.json`) and particle definitions (`particles/detailed_particles.json`)

## Compatibility

- Minecraft Bedrock Edition `1.19.80+`

## Pack layout

```
minecraft_resource_pack/
├── manifest.json
├── animation_controllers.json
├── animations/
│   ├── detailed_animations.json
│   └── player.json
├── entity/
│   ├── animated_blocks.json
│   ├── mobs_detailed.json
│   └── player.json
├── models/
│   └── geometry_detailed.json
├── particles/
│   └── detailed_particles.json
├── render_controllers.json
└── materials.json
```
