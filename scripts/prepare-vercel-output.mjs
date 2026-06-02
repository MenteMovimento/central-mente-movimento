import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const publicDir = path.join(root, 'public')
const sociosSource = path.join(root, 'portal', 'modules', 'socios')
const sociosOutput = path.join(publicDir, 'area', 'socios')
const dispositivosDist = path.join(root, 'portal', 'modules', 'dispositivos', 'dist')
const dispositivosOutput = path.join(publicDir, 'area', 'dispositivos')

const supabaseUrl =
  process.env.SUPABASE_URL ??
  process.env.VITE_SUPABASE_URL ??
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  ''

const supabaseAnonKey =
  process.env.SUPABASE_ANON_KEY ??
  process.env.VITE_SUPABASE_ANON_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  ''

const jsString = (value) => JSON.stringify(String(value ?? ''))

await rm(publicDir, { recursive: true, force: true })
await mkdir(publicDir, { recursive: true })

await cp(sociosSource, sociosOutput, {
  recursive: true,
  filter: (source) => {
    const name = path.basename(source)
    return !['api', 'supabase', 'vercel.json'].includes(name)
  },
})

const sociosIndexPath = path.join(sociosOutput, 'index.html')
let sociosIndex = await readFile(sociosIndexPath, 'utf8')
sociosIndex = sociosIndex
  .replace(/\s*<script src="central-socios-client\.js" defer><\/script>/, '')
  .replace('<script src="app.js" defer></script>', '<script src="config.js" defer></script>\n    <script src="app.js" defer></script>')
await writeFile(sociosIndexPath, sociosIndex)
await rm(path.join(sociosOutput, 'central-socios-client.js'), { force: true })

await writeFile(
  path.join(sociosOutput, 'config.js'),
  `window.SOCIOS_CONFIG = {
  supabaseUrl: ${jsString(supabaseUrl)},
  supabaseAnonKey: ${jsString(supabaseAnonKey)},
  captchaProvider: "",
  captchaSiteKey: "",
  organizationName: "Central MenteMovimento",
};
`,
)

if (!existsSync(dispositivosDist)) {
  throw new Error('A build de Dispositivos nao gerou a pasta dist.')
}

await cp(dispositivosDist, dispositivosOutput, { recursive: true })

await writeFile(
  path.join(publicDir, 'index.html'),
  `<!doctype html>
<html lang="pt">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Central MenteMovimento</title>
    <style>
      :root {
        color-scheme: light;
        --ink: #06194a;
        --muted: #506174;
        --line: #cfe0e7;
        --soft: #eef8f6;
        --green: #10b981;
        --blue: #07599f;
        --panel: #ffffff;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
        color: var(--ink);
        background: linear-gradient(180deg, #f7fbfb 0%, #eaf4f6 100%);
        min-height: 100vh;
      }
      header {
        min-height: 112px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 24px;
        padding: 24px 40px;
        background: var(--panel);
        border-bottom: 1px solid var(--line);
      }
      .brand {
        display: flex;
        align-items: center;
        gap: 16px;
      }
      .mark {
        width: 68px;
        height: 68px;
        border-radius: 8px;
        display: grid;
        place-items: center;
        background: #e7f8f3;
        border: 1px solid #bfeadf;
        color: #087c69;
        font-weight: 900;
        font-size: 26px;
      }
      h1, p { margin: 0; }
      h1 { font-size: clamp(26px, 3vw, 38px); letter-spacing: 0; }
      .brand p { margin-top: 4px; color: var(--muted); font-weight: 600; }
      main {
        width: min(1180px, calc(100% - 40px));
        margin: 48px auto;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 18px;
      }
      .card {
        display: flex;
        flex-direction: column;
        min-height: 220px;
        padding: 24px;
        border: 1px solid var(--line);
        border-radius: 8px;
        background: var(--panel);
        text-decoration: none;
        color: inherit;
        box-shadow: 0 18px 50px rgba(7, 42, 71, 0.08);
      }
      .card:hover { border-color: #7bcfc2; transform: translateY(-1px); }
      .card strong { font-size: 24px; margin-bottom: 10px; }
      .card span { color: var(--muted); line-height: 1.55; }
      .open {
        margin-top: auto;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        min-height: 44px;
        padding: 0 16px;
        border-radius: 8px;
        background: var(--green);
        color: white;
        font-weight: 800;
      }
      .note {
        margin-top: 24px;
        padding: 18px 20px;
        border: 1px solid #b7d8f2;
        border-radius: 8px;
        background: #f4faff;
        color: #1d4d76;
        line-height: 1.5;
      }
      @media (max-width: 820px) {
        header { align-items: flex-start; padding: 20px; }
        .grid { grid-template-columns: 1fr; }
      }
    </style>
  </head>
  <body>
    <header>
      <div class="brand">
        <div class="mark">MM</div>
        <div>
          <h1>Central MenteMovimento</h1>
          <p>Gestao integrada da associacao</p>
        </div>
      </div>
    </header>
    <main>
      <section class="grid" aria-label="Areas de gestao">
        <a class="card" href="/area/socios/">
          <strong>Socios</strong>
          <span>Gestao de socios, quotas, exportacoes, historico e administradores.</span>
          <span class="open">Abrir Socios</span>
        </a>
        <a class="card" href="/area/utentes/">
          <strong>Utentes</strong>
          <span>Fichas, separadores, anexos PDF, genograma, ecomapa e historico.</span>
          <span class="open">Abrir Utentes</span>
        </a>
        <a class="card" href="/area/dispositivos/">
          <strong>Dispositivos</strong>
          <span>Listagem, reparacoes, estados, estatisticas, anexos e CSV.</span>
          <span class="open">Abrir Dispositivos</span>
        </a>
      </section>
      <p class="note">
        Esta e a primeira versao publicada da Central. Mantem os sites antigos ativos ate validarmos login, permissoes, anexos e migracao dos dados reais.
      </p>
    </main>
  </body>
</html>
`,
)

await writeFile(
  path.join(publicDir, '404.html'),
  `<!doctype html><html lang="pt"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Pagina nao encontrada</title></head><body><main style="font-family:system-ui,sans-serif;max-width:680px;margin:80px auto;padding:24px"><h1>Pagina nao encontrada</h1><p><a href="/">Voltar a Central</a></p></main></body></html>`,
)

console.log('Output de producao criado em public/.')
