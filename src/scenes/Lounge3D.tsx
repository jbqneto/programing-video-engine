import React, {useLayoutEffect, useMemo} from 'react';
import {ThreeCanvas} from '@remotion/three';
import {useThree} from '@react-three/fiber';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../lib/schema';
import {clamp01, easeInOut, hash, lerp} from '../lib/math';

type Lounge = Extract<Scene, {type: 'lounge-3d'}>;

const CameraRig: React.FC<{x: number; y: number; z: number}> = ({x, y, z}) => {
  const {camera} = useThree();
  useLayoutEffect(() => {
    camera.position.set(x, y, z);
    camera.lookAt(0, 1.8, -4);
    camera.updateProjectionMatrix();
  }, [camera, x, y, z]);
  return null;
};

const Box: React.FC<{position: [number, number, number]; scale: [number, number, number]; color: string; metalness?: number; roughness?: number}> = ({position, scale, color, metalness = 0, roughness = 0.75}) => (
  <mesh position={position} castShadow receiveShadow>
    <boxGeometry args={scale}/>
    <meshStandardMaterial color={color} metalness={metalness} roughness={roughness}/>
  </mesh>
);

const Snow: React.FC<{frame: number; fps: number; count: number; speed: number; seed: number}> = ({frame, fps, count, speed, seed}) => {
  // Positions are derived from the seed and frame, without deltaTime or Math.random().
  const flakes = useMemo(() => Array.from({length: count}, (_, i) => ({
    x: lerp(0.35, 4.8, hash(seed + i * 2.11)),
    y: hash(seed + i * 5.13),
    z: -5.35 - hash(seed + i * 7.3) * 0.6,
    phase: hash(seed + i * 11.1) * Math.PI * 2,
    radius: 0.009 + hash(seed + i * 13.7) * 0.014,
  })), [count, seed]);
  return <group>{flakes.map((f, i) => {
    const time = frame / fps;
    const y = 0.15 + ((f.y * 4.4 - time * speed * (0.65 + hash(i + seed)) + 1000) % 4.4);
    const x = f.x + Math.sin(time * 0.8 + f.phase) * 0.11;
    return <mesh key={i} position={[x, y, f.z]}>
      <sphereGeometry args={[f.radius, 5, 4]}/>
      <meshBasicMaterial color="#f4f7ff" transparent opacity={0.75}/>
    </mesh>;
  })}</group>;
};

const LoungeEnvironment: React.FC<{scene: Lounge; frame: number; fps: number}> = ({scene, frame, fps}) => {
  const t = easeInOut(frame / Math.max(1, scene.durationFrames - 1));
  const camX = lerp(scene.camera.startX, scene.camera.endX, t);
  const {palette} = scene;
  return <>
    <CameraRig x={camX} y={scene.camera.y} z={scene.camera.z}/>
    <color attach="background" args={[palette.background]}/>
    <ambientLight intensity={0.5} color="#8c9fbc"/>
    <directionalLight position={[-5, 9, 6]} intensity={1.0} color="#efcb9e"/>
    <pointLight position={[-2.5, 3.2, -1]} intensity={46} color={palette.accent} distance={12}/>
    <pointLight position={[3.4, 3.4, -4.4]} intensity={15} color="#a5c9ff" distance={9}/>
    {/* Room, with negative Z depth */}
    <Box position={[0, -0.17, -1.5]} scale={[14, 0.3, 14]} color="#31251d" roughness={0.47}/>
    <Box position={[-3.8, 2.3, -5.05]} scale={[6.7, 4.7, 0.12]} color="#2b201b"/>
    <Box position={[6.85, 2.3, -1.5]} scale={[0.15, 4.7, 14]} color="#251b19"/>
    <Box position={[-6.85, 2.3, -1.5]} scale={[0.15, 4.7, 14]} color="#251b19"/>
    {/* Large blue glass window with snow outside */}
    <mesh position={[2.45, 2.25, -5.25]}>
      <boxGeometry args={[5.1, 4.2, 0.07]}/>
      <meshPhysicalMaterial color="#355877" transparent opacity={0.28} metalness={0.18} roughness={0.15} depthWrite={false}/>
    </mesh>
    <Snow frame={frame} fps={fps} {...scene.snowfall}/>
    <Box position={[-0.15, 2.3, -5]} scale={[0.15, 4.7, 0.2]} color="#4a3020"/>
    <Box position={[5.1, 2.3, -5]} scale={[0.15, 4.7, 0.2]} color="#4a3020"/>
    <Box position={[2.48, 4.45, -5]} scale={[5.3, 0.16, 0.2]} color="#4a3020"/>
    <Box position={[2.48, 0.18, -5]} scale={[5.3, 0.2, 0.2]} color="#4a3020"/>
    <Box position={[2.5, 2.3, -5]} scale={[0.1, 4.2, 0.2]} color="#69452c"/>
    <Box position={[2.48, 2.3, -5]} scale={[5.2, 0.11, 0.2]} color="#69452c"/>
    {/* Lounge and table */}
    <Box position={[-3.15, 0.55, -2.8]} scale={[4.45, 1.05, 1.5]} color={palette.secondary}/>
    <Box position={[-3.15, 1.18, -3.39]} scale={[4.45, 1.65, 0.36]} color={palette.secondary}/>
    <Box position={[-1.25, 0.6, -0.72]} scale={[2.25, 0.14, 1.35]} color="#7c5130" metalness={0.13} roughness={0.27}/>
    <Box position={[-1.9, 0.25, -0.72]} scale={[0.18, 0.6, 0.18]} color="#3f2a1e"/>
    <Box position={[-0.6, 0.25, -0.72]} scale={[0.18, 0.6, 0.18]} color="#3f2a1e"/>
    {/* Candle and point light */}
    <mesh position={[-1.1, 0.75, -0.68]}>
      <cylinderGeometry args={[0.065, 0.07, 0.22, 16]}/>
      <meshStandardMaterial color="#f7e5c4" emissive="#c08335" emissiveIntensity={0.15}/>
    </mesh>
    <mesh position={[-1.1, 0.92, -0.68]}>
      <sphereGeometry args={[0.055, 12, 12]}/>
      <meshBasicMaterial color="#ffd78e"/>
    </mesh>
    {/* Simplified floor lamp */}
    <mesh position={[-5.55, 2.15, -3.25]}>
      <coneGeometry args={[0.48, 0.65, 16, 1, true]}/>
      <meshStandardMaterial side={2} color="#d6a66d" emissive="#8b5520" emissiveIntensity={0.65}/>
    </mesh>
    <Box position={[-5.55, 1.17, -3.25]} scale={[0.065, 1.5, 0.065]} color="#9d7441" metalness={0.7}/>
    <mesh position={[-5.55, 0.37, -3.25]}>
      <cylinderGeometry args={[0.32, 0.32, 0.08, 16]}/>
      <meshStandardMaterial color="#77553c"/>
    </mesh>
  </>;
};

export const Lounge3D: React.FC<{scene: Lounge}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const fade = interpolate(frame, [0, 16, Math.max(17, scene.durationFrames - 15), scene.durationFrames - 1], [0, 1, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background: scene.palette.background}}>
    <ThreeCanvas width={width} height={height} camera={{fov: 52, position: [0, 2.45, 8]}} style={{width, height}}>
      <LoungeEnvironment scene={scene} frame={frame} fps={fps}/>
    </ThreeCanvas>
    {scene.title && <AbsoluteFill style={{justifyContent:'flex-end', padding:'0 6% 8%', pointerEvents:'none'}}>
      <div style={{color: scene.palette.text, fontFamily:'Georgia, serif', fontSize: width * 0.048, letterSpacing: width * .0003, textShadow:'0 2px 18px #000', opacity:fade}}>{scene.title}</div>
    </AbsoluteFill>}
  </AbsoluteFill>;
};
