import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {Player, type PlayerRef} from '@remotion/player';
import {Video} from '../src/Video';
import {projectFrames, projectSchema, type VideoProject} from '../src/lib/schema';
import {PRESET_CATALOG} from '../src/presets/registry';
import './styles.css';

type Snapshot = {project: VideoProject; revision: string};
type RemoteSeek = {sequence: number; frame: number; playing: boolean};
const frameLabel = (frame: number, fps: number) => {
  const seconds = Math.floor(frame / fps);
  const pad = (v: number) => String(v).padStart(2, '0');
  return pad(Math.floor(seconds / 3600)) + ':' + pad(Math.floor(seconds / 60) % 60) + ':' +
    pad(seconds % 60) + ':' + pad(frame % fps);
};

export const App: React.FC = () => {
  const player = useRef<PlayerRef>(null);
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [frame, setFrame] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [jumpSeconds, setJumpSeconds] = useState('0');
  const [activeScene, setActiveScene] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const revision = useRef<string>('');
  const lastRemoteCommand = useRef<number>(-1);

  useEffect(() => {
    let alive = true;
    const refresh = async () => {
      try {
        const response = await fetch('/api/project', {cache: 'no-store'});
        if (!response.ok) throw new Error('Project API returned HTTP ' + response.status);
        const data = await response.json();
        const project = projectSchema.parse(data.project);
        if (alive && revision.current !== data.revision) {
          revision.current = data.revision;
          setSnapshot({project, revision: data.revision});
          setFrame(0);
          setError(null);
        }
      } catch (err) {
        if (alive) setError(err instanceof Error ? err.message : 'Cannot read workbench project');
      }
    };
    void refresh();
    const timer = setInterval(refresh, 1500);
    return () => {alive = false; clearInterval(timer);};
  }, []);

  useEffect(() => {
    let alive = true;
    const poll = async () => {
      try {
        const response = await fetch('/api/preview-state', {cache: 'no-store'});
        if (!response.ok) return;
        const state: RemoteSeek = await response.json();
        if (!alive || lastRemoteCommand.current === state.sequence) return;
        lastRemoteCommand.current = state.sequence;
        if (state.sequence > 0) {
          player.current?.pause();
          player.current?.seekTo(state.frame);
          setFrame(state.frame);
          setPlaying(false);
        }
      } catch { /* The workbench can be restarted without losing the preview. */ }
    };
    void poll();
    const timer = setInterval(poll, 600);
    return () => {alive = false; clearInterval(timer);};
  }, [snapshot?.revision]);

  useEffect(() => {
    const control = player.current;
    if (!control) return;
    const update = () => setFrame(control.getCurrentFrame());
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    control.addEventListener('frameupdate', update);
    control.addEventListener('play', onPlay);
    control.addEventListener('pause', onPause);
    return () => {
      control.removeEventListener('frameupdate', update);
      control.removeEventListener('play', onPlay);
      control.removeEventListener('pause', onPause);
    };
  }, [snapshot?.revision]);

  const seek = useCallback((target: number) => {
    if (!snapshot) return;
    const bounded = Math.max(0, Math.min(projectFrames(snapshot.project) - 1, Math.round(target)));
    player.current?.seekTo(bounded);
    setFrame(bounded);
    setJumpSeconds((bounded / snapshot.project.fps).toFixed(2));
  }, [snapshot]);

  const timeline = useMemo(() => {
    if (!snapshot) return [];
    let start = 0;
    return snapshot.project.scenes.map(scene => {
      const entry = {...scene, startFrame: start};
      start += scene.durationFrames;
      return entry;
    });
  }, [snapshot]);

  if (!snapshot) return <div className="loading">
    <h1>Programming Video Engine</h1>
    <p>{error ?? 'Connecting to the local workbench...'}</p>
    <p>Run <code>npm run workbench</code> from the repository.</p>
  </div>;
  const {project} = snapshot;
  const total = projectFrames(project);
  const selected = timeline.find(scene => scene.id === activeScene) ?? timeline.find(scene =>
    frame >= scene.startFrame && frame < scene.startFrame + scene.durationFrames);
  return <div className="shell">
    <header className="header">
      <div><strong>Programming Video Engine</strong><span className="eyebrow">Agent-ready cinematic workbench</span></div>
      <div className="status"><span className="online"/> <span>Local MCP :3333</span><small>Version 0.2</small></div>
    </header>
    <div className="workspace">
      <main className="main">
        <section className="viewer">
          <div className="section-heading"><h2>{project.title}</h2><span>{project.width} × {project.height} · {project.fps} FPS</span></div>
          <div className="player-stage">
            <Player key={snapshot.revision} ref={player} component={Video} inputProps={{project}}
              durationInFrames={total} compositionWidth={project.width} compositionHeight={project.height}
              fps={project.fps} autoPlay={false} controls={false}
              style={{width: '100%', aspectRatio: String(project.width) + ' / ' + String(project.height)}}/>
          </div>
          <div className="transport">
            <button onClick={() => seek(0)} title="Beginning">⏮</button>
            <button className="primary" onClick={() => {if (player.current?.isPlaying()) player.current.pause(); else player.current?.play(); setPlaying(Boolean(!player.current?.isPlaying()));}}>
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => seek(frame - 1)} title="Previous frame">‹</button>
            <button onClick={() => seek(frame + 1)} title="Next frame">›</button>
            <div className="timecode">{frameLabel(frame, project.fps)} <span>/ {frameLabel(total - 1, project.fps)}</span></div>
            <label className="jump">Jump to second <input type="number" min="0" step="0.01" value={jumpSeconds}
              onChange={e => setJumpSeconds(e.target.value)}
              onKeyDown={e => {if(e.key === 'Enter') seek(Number(jumpSeconds) * project.fps);}}/>
            </label>
            <button onClick={() => seek(Number(jumpSeconds) * project.fps)}>Go</button>
          </div>
        </section>
        <section className="timeline">
          <div className="section-heading"><h2>Timeline</h2><span>{total} frames · {(total / project.fps).toFixed(2)}s</span></div>
          <input aria-label="Timeline frame" className="scrubber" type="range" min="0" max={total - 1}
            value={Math.min(frame, total - 1)} onChange={e => seek(Number(e.target.value))}/>
          <div className="scene-track">
            {timeline.map((scene, i) => <button key={scene.id} className={'scene-segment ' + (selected?.id === scene.id ? 'selected' : '')}
              style={{flexGrow: scene.durationFrames, flexBasis: 0}} onClick={() => {setActiveScene(scene.id);seek(scene.startFrame);}}
              title={scene.id + ' (' + scene.durationFrames + ' frames)'}>
              <span>{i + 1}. {scene.type}</span><small>{(scene.durationFrames / project.fps).toFixed(1)}s</small>
            </button>)}
          </div>
          <div className="timeline-note">Select a clip to inspect it. Drag the slider or jump to a precise second; agents can seek the same preview through MCP.</div>
        </section>
      </main>
      <aside className="inspector">
        <section>
          <h2>Scene inspector</h2>
          {selected ? <>
            <div className="kv"><span>Scene ID</span><strong>{selected.id}</strong></div>
            <div className="kv"><span>Start</span><strong>{frameLabel(selected.startFrame, project.fps)}</strong></div>
            <div className="kv"><span>Duration</span><strong>{selected.durationFrames} frames</strong></div>
            <pre>{JSON.stringify(selected, null, 2)}</pre>
          </> : <p>No scene selected.</p>}
        </section>
        <section>
          <h2>Animation presets</h2>
          {PRESET_CATALOG.map(preset => <div key={preset.id} className="preset">
            <strong>{preset.name}</strong><span>{preset.id} · v{preset.version}</span>
            <p>{preset.description}</p><small>Inputs: {preset.inputs.map(input => input.name).join(', ')}</small>
          </div>)}
          <p className="help">Presets are applied through the MCP <code>apply_preset</code> tool. The browser automatically reloads changed project JSON.</p>
        </section>
        <section className="help">
          <h2>Agent interface</h2>
          <p>Streamable HTTP MCP: <code>http://127.0.0.1:3333/mcp</code></p>
          <p>Stdio: <code>npm run mcp:stdio</code></p>
          <p>Agent instructions: <code>AGENTS.md</code></p>
        </section>
      </aside>
    </div>
    {error && <div className="error" role="alert">{error}</div>}
  </div>;
};
