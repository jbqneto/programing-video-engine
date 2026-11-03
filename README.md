# Video Production Engine — MVP 0.1

Protótipo declarativo para gerar vídeos 3D com **Remotion + Three.js / React Three Fiber**. O projeto é configurado por JSON e prepara a separação entre especificação de cenas e renderizadores.

## Requisitos
- Node.js >= 22 e npm
- Chromium/WebGL disponível; GPU recomendada (render por software pode ser lento)
- FFmpeg para pós-produção

## Executar

```bash
npm install
npm run smoke
npm run validate
npm run studio
npm run render -- --project src/projects/afterhours-demo.json --out out/afterhours-demo.mp4
```

O `npm run studio` permite inspecionar a composição `CinematicDemo`. O `npm run render` gera MP4 H.264 1280x720, 30 fps, com 9 segundos (configuração inicial). O renderizador usa `--gl angle`, necessário em instalações com Remotion 4 + Three.js; altere em ambiente Linux sem GPU caso seja preciso usar `swangle`.

### Personalizar

Edite `src/projects/afterhours-demo.json`:

- `width`, `height`, `fps`: formato de saída
- `scenes[]`: cenas sequenciais, duração em **frames**
- `lounge-3d`: ambiente 3D, neve determinística, câmera lenta
- `motion-3d`: anéis metálicos tridimensionais e tipografia
- `palette`, `camera`, `snowfall`, `rings`, `title`: parâmetros por cena
- `audio`: opcional. Ex.: `"audio": {"src": "audio/trilha.mp3", "volume": 0.8}`; colocar arquivo em `public/audio/`.

O comando valida o JSON antes de renderizar. `calculateMetadata()` deriva resolução, fps e duração diretamente das propriedades do projeto. A renderização de cada frame depende do **frame absoluto da cena** e de um **seed**, nunca de tempo de relógio nem de valores aleatórios não determinísticos.

## Estrutura

```
src/lib/schema.ts            # contrato JSON e validação Zod
src/lib/math.ts              # animação determinística
src/projects/*.json          # projetos e parâmetros
src/scenes/Lounge3D.tsx      # cenário realista estilizado + neve + câmera
src/scenes/Motion3D.tsx      # objetos 3D cinéticos + títulos
src/Video.tsx                # timeline e composição
src/Root.tsx                 # metadados dinâmicos
scripts/validate.ts          # verificação CLI
scripts/render.ts            # execução CLI (adaptador Remotion)
remotion.config.ts           # configuração do renderer WebGL
```

## Roteiro para transformar em produto

1. Criar um registro de `SceneType` e `RenderAdapter` (`remotion`, `hyperframes`, `blender`), com schemas separados para efeitos/câmeras/objetos.
2. Cache de assets por hash; `manifest.json` por render com seed, versões, fps e id de projeto.
3. API `POST /render-jobs`, fila BullMQ/Redis, worker isolado, progresso e cancelamento, limitação por memória/GPU.
4. Preview parcial (still/5s) antes de renderizar 1080p ou 4K.
5. Render de cenas para arquivos intermediários; composição final via FFmpeg, trilhas, legendas SRT/VTT.
6. Sandbox de entrada de agentes: schemas rígidos, URL/media local pré-validada, limites de duração/cena e memória.

## Limitações reais

- Este é um **MVP local**, não um render farm ou uma API multiusuário.
- A sala usa primitivas 3D estilizadas. **Não é fotorrealismo**: para isso, acrescentar assets glTF/HDRI e cenas Blender com iluminação fisicamente baseada.
- O ZIP não inclui música nem modelos com direitos de terceiros.
- As dependências npm precisam ser instaladas na máquina do usuário. Não foram obtidas neste ambiente sem rede para o registro npm; portanto ainda **não foi executado um render Remotion end-to-end** aqui.
- Para Linux server-side, poderá ser necessário ajustar renderer WebGL/Chromium e segmentar vídeos longos.

## Fontes

- https://www.remotion.dev/docs/three
- https://www.remotion.dev/docs/three-canvas
- https://www.remotion.dev/docs/dynamic-metadata
- https://github.com/heygen-com/hyperframes
- https://docs.blender.org/manual/en/4.5/advanced/command_line/index.html

Consulte `docs/architecture.md` para o desenho da futura API, fila de jobs, interfaces de render e politicas de isolamento.
