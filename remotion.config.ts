import {Config} from '@remotion/cli/config';

// Necessario no Remotion 4 em ambientes com Three.js/WebGL.
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setOverwriteOutput(true);
