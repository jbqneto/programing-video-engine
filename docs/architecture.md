# Video Production Engine — arquitetura de evolucao

## Objetivo e nao-objetivos

**Objetivo:** especificar vídeos em JSON e renderizar cenas heterogêneas com timeline determinística, registrando os artefatos produzidos. **Não-objetivo no MVP:** construir um editor do zero, gerar imagens fotorrealistas automaticamente a partir de prompts, renderizar GPU remoto ou executar código de terceiros.

## Contratos propostos (v0.2, nao implementados neste MVP)

`POST /api/render-jobs` -> aceita `{projectId, engine, preset, priority}`. Retorna `202 {jobId, status:"queued"}`. O usuário define um projeto por JSON e faz upload de assets previamente.

`GET /api/render-jobs/:id` -> `{jobId,status,progress:{framesDone,framesTotal},startedAt,finishedAt,artifacts:[{kind,path,sha256}]}`. `DELETE /api/render-jobs/:id` solicita cancelamento.

`POST /api/projects/:id/preview` -> render de 1 frame (thumbnail) ou trecho limitado, custo computacional menor que vídeo final.

Estados da fila: `queued -> validating -> preparing -> rendering -> muxing -> done` (ou `failed`, `cancelled`). Operações idempotentes por hash de projeto + versões de assets + versão da engine.

## Adapters de render

```ts
export type RenderInput = {projectId: string; sceneId: string; fps: number; width: number; height: number; outputDir: string};
export type RenderOutput = {kind: 'mp4' | 'png-sequence'; path: string; frames: number};
export interface RenderAdapter {
  readonly engine: 'remotion' | 'hyperframes' | 'blender';
  validateCapabilities(input: RenderInput): Promise<void>;
  render(input: RenderInput, signal: AbortSignal): Promise<RenderOutput>;
}
```

Esse contrato e **desenho para proxima etapa**, nao codigo implementado. Render por cena permite misturar ferramentas com composição final via FFmpeg. Todos os renderizadores devem operar com fps e dimensões fixas e produzir intermediários consistentes.

## Observabilidade e qualidade

- Logs estruturados com `projectId`, `jobId`, `sceneId`, versão de engine, tempo total, CPU/GPU, pico de memória, exit code.
- Arquivos `manifest.json` com parâmetros, hashes SHA-256 e seed; cada artefato deve ser reprodutível.
- Render de prévia de 1-3 segundos, em 480p, antes de 1080p/4K.
- Teste de consistência `frame(100)` em renderizações repetidas.
- Limites explícitos de JSON por job e whitelist de tipos/caminhos; bloquear URLs remotas não aprovadas e scripts arbitrários vindos de agentes.
- Fail-fast em assets ausentes, versão não suportada de schema e codecs indisponíveis.

## Modos de operação

- **Local**: Node.js + Remotion Studio + FFmpeg na máquina de desenvolvimento.
- **Worker**: API/queue na VPS e renderização pesada em máquina com GPU, quando necessário.
- **Blender**: exportação de PNG/EXR ou H.264, importado para timeline Remotion/FFmpeg; preferir PNG/EXR quando composição e alpha forem necessários.
- **HyperFrames**: projetos HTML e animações seekable, úteis para geração por agentes; introduzir após teste de fidelidade e estabilidade.

## Estrutura de biblioteca de cenas

Cenas versionadas por `type`, `version`, `defaults` e `schema`: `lounge-3d`, `motion-3d`, `book-opening`, `parallax-2_5d`, `map-route`, `caption-overlay`, `transition`.

Separar `scene.spec` (dados) de `scene.renderer` (código) permite testar presets, trocar backend e automatizar a produção sem reescrever animações. A implementação atual contém apenas os dois primeiros tipos.
