import React from 'react';
import {AbsoluteFill, Img, interpolate, staticFile, useCurrentFrame} from 'remotion';
import type {Scene} from '../lib/schema';
import {PRESET_CATALOG} from '../presets/registry';

type ImageScene = Extract<Scene, {type: 'image-transition'}>;
const fixed = PRESET_CATALOG[0].effects;

export const ImageTransition: React.FC<{scene: ImageScene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const transitionStart = Math.floor(scene.durationFrames * fixed.transitionStartFraction);
  const transitionEnd = Math.min(scene.durationFrames - 1, transitionStart + Math.max(1, Math.floor(scene.durationFrames * fixed.transitionFraction)));
  const t = interpolate(frame, [transitionStart, transitionEnd], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  const eased = t * t * (3 - 2 * t);
  const base: React.CSSProperties = {width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0};
  return <AbsoluteFill style={{backgroundColor: scene.palette.background, overflow: 'hidden'}}>
    <Img src={staticFile(scene.inputs.imageA)} style={{
      ...base, opacity: 1 - eased,
      transform: 'scale(' + (1 - (1 - fixed.outgoingScale) * eased).toFixed(5) + ')'
    }}/>
    <Img src={staticFile(scene.inputs.imageB)} style={{
      ...base, opacity: eased,
      filter: 'blur(' + (fixed.incomingBlurPx * (1 - eased)).toFixed(3) + 'px)',
      transform: 'scale(' + (fixed.incomingScale - (fixed.incomingScale - 1) * eased).toFixed(5) + ')'
    }}/>
  </AbsoluteFill>;
};
