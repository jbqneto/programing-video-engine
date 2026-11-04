import {Config} from '@remotion/cli/config';

// Required by Remotion 4 with Three.js/WebGL in some environments.
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
