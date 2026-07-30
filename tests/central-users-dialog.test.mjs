import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import test from 'node:test'
import { fileURLToPath } from 'node:url'

const directory = path.dirname(fileURLToPath(import.meta.url))
const projectRoot = path.resolve(directory, '..')

const readProjectFile = (relativePath) => readFile(path.join(projectRoot, relativePath), 'utf8')

test('the user list opens create and edit forms in a secondary dialog', async () => {
  const [buildScript, appSource] = await Promise.all([
    readProjectFile('scripts/prepare-vercel-output.mjs'),
    readProjectFile('portal/static/app.js'),
  ])

  assert.match(buildScript, /id="centralOpenCreateUserBtn"/)
  assert.match(buildScript, /id="centralUserEditorDialog"/)
  assert.match(buildScript, /id="centralCloseUserEditorBtn"/)
  assert.match(buildScript, /id="centralCancelUserEditorBtn"/)
  assert.match(buildScript, /id="centralCancelCreateUserBtn"/)
  assert.match(buildScript, /id="centralCancelEditUserBtn"/)
  assert.match(buildScript, /id="centralEditUserForm" hidden/)
  assert.match(appSource, /const openCentralUserEditor = \(mode, user = null\) =>/)
  assert.match(appSource, /openCentralUserEditor\("create"\)/)
  assert.match(appSource, /openCentralUserEditor\("edit", user\)/)
})

test('permission controls use desktop columns and readable mobile blocks', async () => {
  const [appSource, stylesSource] = await Promise.all([
    readProjectFile('portal/static/app.js'),
    readProjectFile('portal/static/styles.css'),
  ])

  assert.match(appSource, /data-permission-label/)
  assert.match(stylesSource, /central-user-editor-dialog \.permission-matrix-wrap \{\s*overflow-x: visible;/)
  assert.match(stylesSource, /permission-matrix td::before/)
  assert.match(stylesSource, /content: attr\(data-permission-label\)/)
})

test('email verification keeps its state in memory when sessionStorage is unavailable', async () => {
  const buildScript = await readProjectFile('scripts/prepare-vercel-output.mjs')

  assert.match(buildScript, /let inMemoryVerificationState = null;/)
  assert.match(buildScript, /const safeSessionStorage = \{/)
  assert.match(buildScript, /inMemoryVerificationState = state;/)
  assert.match(buildScript, /const state = storedState \|\| inMemoryVerificationState;/)
})
