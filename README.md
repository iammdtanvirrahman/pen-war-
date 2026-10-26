# Pen Fighter (React + Three.js + Cannon-es)

A high-stakes 3D tabletop duel game rewritten in React, TypeScript, Vite, and Tailwind CSS, preserving the original physics simulation, slingshot mechanics, and dual-player/AI gameplay.

## Features

- **Tabletop 3D Simulation**:
  - Three.js 3D rendering with ACES Filmic tone mapping, PCF soft shadows, and dynamic lighting.
  - Cannon-es rigid-body physics engine simulating rod-like inertia (multi-sphere capsule colliders), realistic Coulomb sliding deceleration, spin friction, and roll damping.
  - Procedural/Web Audio collision audio synthesize responsive sound effects for strikes and impacts.
- **Match Formats**:
  - Opponents: Local 2-player pass-and-play ("Friend on this device") or single-player vs AI ("Computer").
  - AI Difficulties: Easy, Medium, and Hard, factoring in distance, required impulse velocity, and angular error margins.
  - Team Size: 1 vs 1, 2 vs 2, 3 vs 3, or 4 vs 4 pens.
- **Slingshot Aiming Controls**:
  - Touch or click-and-drag directly on your active glowing pens.
  - Dynamic aim arrow showing launch vector and power percentage.
  - Slingshot tension band showing finger offset.
  - Trajectory guide line indicating predicted glide distance before sliding friction brings the pen to a stop.
  - Off-center strike detection giving accurate spin (centre strikes slide straight, off-centre strikes induce rotational torque).
- **Cinematic Camera**:
  - Smooth spherical interpolation transitions between player perspectives at turn switch.
  - OrbitControls for rotating and inspecting the table.
  - Dynamic pen tracking while shots are traveling across the bench.
  - Automatic gentle rotation in setup and game over states.

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **3D & Physics**: Three.js, Cannon-es
- **Audio**: Web Audio API

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build production bundle
npm run build
```
