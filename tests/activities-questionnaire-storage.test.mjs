import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import {
  parseStoredQuestionnaire,
  questionnaireTabKey,
} from "../api/activities-questionnaires.js";

const apiSource = await readFile(new URL("../api/activities-questionnaires.js", import.meta.url), "utf8");
const appSource = await readFile(new URL("../portal/static/app.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../portal/modules/atividades/page.mjs", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../portal/static/styles.css", import.meta.url), "utf8");

test("monthly questionnaires use a deterministic key in the existing utente_abas table", () => {
  assert.equal(questionnaireTabKey("activity-7", 2026, 7), "activities_questionnaire:activity-7:2026-07");
  assert.match(apiSource, /\.from\('utente_abas'\)/);
  assert.doesNotMatch(apiSource, /\.from\('activities_questionnaires'\)/);
  assert.match(apiSource, /\.from\('activities_catalog'\)/);
  assert.match(apiSource, /\.from\('utentes'\)/);
});

test("stored questionnaire JSON is recovered from utente_abas", () => {
  const stored = parseStoredQuestionnaire({
    id: 91,
    utente_id: 12,
    tab_key: "activities_questionnaire:activity-7:2026-07",
    created_at: "2026-07-01T10:00:00.000Z",
    updated_at: "2026-07-02T10:00:00.000Z",
    conteudo: JSON.stringify({
      kind: "activity_questionnaire",
      activityId: "activity-7",
      activityName: "Moda",
      utenteId: "12",
      utenteName: "Utente teste",
      year: 2026,
      month: 7,
      responses: { participation_1: 4 },
      completedAt: "2026-07-02T10:00:00.000Z",
      createdBy: "user-a",
      updatedBy: "user-b",
    }),
  });

  assert.equal(stored.id, "91");
  assert.equal(stored.activityName, "Moda");
  assert.equal(stored.utenteName, "Utente teste");
  assert.equal(stored.month, 7);
  assert.equal(stored.year, 2026);
  assert.equal(stored.createdBy, "user-a");
  assert.equal(stored.updatedBy, "user-b");
});

test("questionnaire modal renders period selectors without a standalone scale block", () => {
  assert.match(pageSource, /data-questionnaire-month/);
  assert.match(pageSource, /data-questionnaire-year/);
  assert.doesNotMatch(pageSource, /activity-questionnaire-scale/);

  const openStart = appSource.indexOf("const openActivityQuestionnaireDialog = async () => {");
  const loadPosition = appSource.indexOf("await loadActivityQuestionnaires();", openStart);
  const optionsPosition = appSource.indexOf("renderActivityQuestionnaireOptionLists();", openStart);
  assert.notEqual(openStart, -1);
  assert.ok(optionsPosition > openStart && optionsPosition < loadPosition);
});

test("questionnaire questions only render after the full context is selected", () => {
  assert.match(pageSource, /data-questionnaire-questions hidden/);
  assert.match(pageSource, /data-questionnaire-save disabled/);
  assert.match(appSource, /const hasCompleteActivityQuestionnaireContext = \(\) =>/);
  assert.match(appSource, /questions\.hidden = !hasCompleteContext/);
  assert.match(appSource, /saveBtn\.disabled = !hasCompleteContext/);
});

test("saved questionnaires can be deleted safely from utente_abas", () => {
  assert.match(apiSource, /\['GET', 'POST', 'DELETE'\]/);
  assert.match(apiSource, /const deleteQuestionnaire = async[\s\S]*\.from\('utente_abas'\)[\s\S]*\.delete\(\)/);
  assert.match(apiSource, /startsWith\(QUESTIONNAIRE_TAB_PREFIX\)/);
  assert.match(appSource, /data-questionnaire-delete-record/);
  assert.match(appSource, /activities\.questionnaireDeleteConfirm/);
  assert.match(appSource, /method: "DELETE"/);
});

test("saved questionnaires open in a separate read-only consultation view", () => {
  assert.match(pageSource, /data-questionnaire-view="detail"/);
  assert.match(pageSource, /data-questionnaire-detail-content/);
  assert.match(pageSource, /data-questionnaire-existing-open/);
  assert.match(appSource, /const renderActivityQuestionnaireDetail = \(record\) =>/);
  assert.match(appSource, /saveBtn\.disabled = !hasCompleteContext \|\| Boolean\(record\)/);

  const openStart = appSource.indexOf("const openStoredActivityQuestionnaire = (id) => {");
  const openEnd = appSource.indexOf("const clearActivityQuestionnaireResponses", openStart);
  const openBlock = appSource.slice(openStart, openEnd);
  assert.match(openBlock, /renderActivityQuestionnaireDetail\(record\)/);
  assert.match(openBlock, /setActivityQuestionnaireTab\("detail"\)/);
  assert.doesNotMatch(openBlock, /applyActivityQuestionnaireResponses/);
  assert.doesNotMatch(openBlock, /activitySelect/);
});

test("questionnaire modal has desktop and mobile layout rules", () => {
  assert.match(stylesSource, /\.activity-questionnaire-context[\s\S]*grid-template-columns: repeat\(4/);
  assert.match(stylesSource, /\.activity-questionnaire-question[\s\S]*grid-template-columns: minmax\(0, 1fr\) auto/);
  assert.match(stylesSource, /@media \(max-width: 620px\)[\s\S]*\.activity-questionnaire-dialog/);
  assert.match(stylesSource, /\.activity-questionnaire-detail-meta[\s\S]*grid-template-columns: repeat\(4/);
  assert.match(stylesSource, /\.activity-questionnaire-detail-answer[\s\S]*grid-template-columns: minmax\(0, 1fr\)/);
});
