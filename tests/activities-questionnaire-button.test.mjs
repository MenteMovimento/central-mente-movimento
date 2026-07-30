import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../portal/static/app.js", import.meta.url), "utf8");

test("questionnaire button is wired when the activities page loads", () => {
  const listenerStart = appSource.indexOf('document.addEventListener("DOMContentLoaded", () => {');
  const listenerEnd = appSource.indexOf("\n});", listenerStart);
  const listenerSource = appSource.slice(listenerStart, listenerEnd);

  assert.notEqual(listenerStart, -1, "DOMContentLoaded handler should exist");
  assert.match(listenerSource, /wireActivitiesQuestionnaireDialog\(\);/);
});

test("questionnaire wiring is idempotent and connects the open button", () => {
  const functionStart = appSource.indexOf("const wireActivitiesQuestionnaireDialog = () => {");
  const functionEnd = appSource.indexOf("\n};", functionStart);
  const functionSource = appSource.slice(functionStart, functionEnd);

  assert.notEqual(functionStart, -1, "questionnaire wiring function should exist");
  assert.match(functionSource, /dialog\.dataset\.activitiesQuestionnaireWired === "true"/);
  assert.match(functionSource, /openBtn\.addEventListener\("click"/);
  assert.match(functionSource, /openActivityQuestionnaireDialog\(\)/);
});
