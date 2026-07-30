import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import test from "node:test";

const manualSource = await readFile(
  new URL("../scripts/generate-manual-pdfs.py", import.meta.url),
  "utf8",
);

test("activities user manual documents the complete monthly questionnaire workflow", () => {
  assert.match(manualSource, /Preencher um questionário mensal/);
  assert.match(manualSource, /Consultar e eliminar questionários anteriores/);
  assert.match(manualSource, /atividades-questionnaire/);
  assert.match(manualSource, /Responder às 19 perguntas/);
  assert.match(manualSource, /Ver questionário realizado/);
});

test("activities developer manual documents questionnaire storage and API", () => {
  assert.match(manualSource, /api\/activities-questionnaires\.js/);
  assert.match(manualSource, /public\.utente_abas/);
  assert.match(manualSource, /activities_questionnaire:<activityId>:<AAAA-MM>/);
  assert.match(manualSource, /19 chaves estáveis/);
  assert.match(manualSource, /GET, POST e DELETE/);
});

test("generated activities manuals are present and non-empty", async () => {
  const manuals = [
    "../portal/modules/atividades/docs/Manual_Utilizador_Atividades.pdf",
    "../portal/modules/atividades/docs/Manual_Programador_Atividades.pdf",
  ];

  for (const relativePath of manuals) {
    const info = await stat(new URL(relativePath, import.meta.url));
    assert.ok(info.size > 100_000, `${relativePath} should contain the generated manual`);
  }
});
