import React from 'react';
import {ThreeCanvas} from '@remotion/three';
import {AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig} from 'remotion';
import type {Scene} from '../lib/schema';

type MotionScene = Extract<Scene, {type: 'motion-3d'}>;

const Sculpture: React.FC<{scene: MotionScene; frame: number}> = ({scene, frame}) => {
  const t = frame / scene.durationFrames;
  return <>
    <color attach="background" args={[scene.palette.background]}/>
    <ambientLight intensity={1.1}/>
    <directionalLight position={[2, 4, 6]} intensity={4} color={scene.palette.accent}/>
    <pointLight position={[-4, 1, 2]} intensity={50} color={scene.palette.secondary}/>
    {Array.from({length: scene.rings}, (_, i) => (
      <mesh key={i} rotation={[Math.PI / 4 + t * (1.2 + i*.35), t * (2 - i * .3), i * 0.7]} scale={1 + i * 0.22}>
        <torusGeometry args={[1.45, 0.065 + i * 0.015, 14, 96]}/>
        <meshStandardMaterial color={i % 2 ? scene.palette.secondary : scene.palette.accent} metalness={0.85} roughness={0.19}/>
      </mesh>
    ))}
    <mesh rotation={[frame * .007, frame * .014, frame * .004]}>
      <icosahedronGeometry args={[0.57, 1]}/>
      <meshStandardMaterial color={scene.palette.accent} metalness={0.85} roughness={0.15}/>
    </mesh>
  </>;
};

export const Motion3D: React.FC<{scene: MotionScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const fade = interpolate(frame, [0, 18, Math.max(19, scene.durationFrames-18), scene.durationFrames-1], [0, 1, 1, 0], {extrapolateLeft:'clamp', extrapolateRight:'clamp'});
  return <AbsoluteFill style={{background: scene.palette.background}}>
    <ThreeCanvas width={width} height={height} camera={{position:[0,0,6.5], fov: 48}} style={{width, height}}>
      <Sculpture frame={frame} scene={scene}/>
    </ThreeCanvas>
    <AbsoluteFill style={{display:'flex', alignItems:'flex-start', justifyContent:'flex-end', padding:'0 0 9% 7%', pointerEvents:'none', opacity: fade}}>
      <div style={{fontFamily:'Georgia, serif', fontSize:width*0.063, color:scene.palette.text, letterSpacing: width*0.002, textShadow:'0 2px 30px #000'}}>{scene.title}</div>
      <div style={{fontFamily:'Arial, sans-serif', fontSize:width*0.014, color:scene.palette.accent, marginTop: width*0.01, letterSpacing: width*0.001}}>{scene.subtitle}</div>
    </AbsoluteFill>
  </AbsoluteFill>;
};
