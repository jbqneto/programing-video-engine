import React from 'react';
import {Composition} from 'remotion';
import demo from './projects/afterhours-demo.json';
import {Video, type VideoProps} from './Video';
import {projectFrames, projectSchema} from './lib/schema';

const project = projectSchema.parse(demo);
export const Root: React.FC = () => <Composition
  id="CinematicDemo"
  component={Video}
  defaultProps={{project} satisfies VideoProps}
  durationInFrames={projectFrames(project)}
  fps={project.fps}
  width={project.width}
  height={project.height}
  calculateMetadata={({props}) => {
    const p = projectSchema.parse(props.project);
    return {durationInFrames: projectFrames(p), fps: p.fps, width: p.width, height: p.height};
  }}
/>;
