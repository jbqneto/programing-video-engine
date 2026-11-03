import React from 'react';
import {AbsoluteFill, Audio, Sequence, staticFile} from 'remotion';
import type {VideoProject, Scene} from './lib/schema';
import {projectSchema} from './lib/schema';
import {Lounge3D} from './scenes/Lounge3D';
import {Motion3D} from './scenes/Motion3D';

const SceneView: React.FC<{scene: Scene}> = ({scene}) => {
  if (scene.type === 'lounge-3d') return <Lounge3D scene={scene}/>;
  return <Motion3D scene={scene}/>;
};

export type VideoProps = {project: VideoProject};
export const Video: React.FC<VideoProps> = ({project: input}) => {
  const project = projectSchema.parse(input);
  let cursor = 0;
  return <AbsoluteFill style={{backgroundColor:'#070b16'}}>
    {project.scenes.map((scene) => {
      const from = cursor;
      cursor += scene.durationFrames;
      return <Sequence key={scene.id} name={scene.id} from={from} durationInFrames={scene.durationFrames}>
        <SceneView scene={scene}/>
      </Sequence>;
    })}
    {project.audio && <Audio src={staticFile(project.audio.src)} volume={project.audio.volume}/>}
  </AbsoluteFill>;
};
