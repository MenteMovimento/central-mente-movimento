import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../portal/static/app.js", import.meta.url), "utf8");
const pageSource = await readFile(new URL("../portal/modules/atividades/page.mjs", import.meta.url), "utf8");
const stylesSource = await readFile(new URL("../portal/static/styles.css", import.meta.url), "utf8");
const manualSource = await readFile(new URL("../scripts/generate-manual-pdfs.py", import.meta.url), "utf8");

test("questionnaire dialog exposes a dedicated averages view and filters", () => {
  assert.match(pageSource, /data-questionnaire-tab="average"/);
  assert.match(pageSource, /data-questionnaire-view="average"/);
  assert.match(pageSource, /data-questionnaire-average-activity/);
  assert.match(pageSource, /data-questionnaire-average-month/);
  assert.match(pageSource, /data-questionnaire-average-year/);
  assert.match(pageSource, /data-questionnaire-average-content/);
});

test("averages are derived from saved response scores and grouped by section", () => {
  assert.match(
    appSource,
    /const activityQuestionnaireMean = \(records, keys = activityQuestionnaireResponseKeys\) =>/,
  );
  assert.match(appSource, /const activityQuestionnaireSectionMean = \(records, section\) =>/);
  assert.match(appSource, /const renderActivityQuestionnaireAverage = \(\) =>/);
  assert.match(appSource, /activityQuestionnaireSections\s*\.map\(\(section\) =>/);
  assert.match(appSource, /record\.activityId === activityId/);
  assert.match(appSource, /record\.month === month/);
  assert.match(appSource, /record\.year === year/);
});

test("average report has an accessible print action", () => {
  assert.match(pageSource, /data-questionnaire-average-print/);
  assert.match(appSource, /const printActivityQuestionnaireAverage = \(\) =>/);
  assert.match(appSource, /activityQuestionnaireAveragePrintDocument\(/);
  assert.match(appSource, /averagePrintBtn\?\.addEventListener\("click", printActivityQuestionnaireAverage\)/);
  assert.match(appSource, /printActivityHtmlDocument\(/);
});

test("a consulted questionnaire displays the individual mean in every section header", () => {
  const detailStart = appSource.indexOf("const renderActivityQuestionnaireDetail = (record) => {");
  const detailEnd = appSource.indexOf("const renderActivityQuestionnaireHistory", detailStart);
  const detailSource = appSource.slice(detailStart, detailEnd);

  assert.notEqual(detailStart, -1, "detail renderer should exist");
  assert.match(detailSource, /activityQuestionnaireSectionMean\(\[record\], section\)/);
  assert.match(detailSource, /activity-questionnaire-section-average/);
  assert.match(detailSource, /activityQuestionnaireAverageValueText\(sectionMean\)/);
});

test("average view is responsive and documented in both activities manuals", () => {
  assert.match(stylesSource, /\.activity-questionnaire-tabs[\s\S]*repeat\(3/);
  assert.match(stylesSource, /\.activity-questionnaire-average-filters/);
  assert.match(stylesSource, /\.activity-questionnaire-average-sections/);
  assert.match(stylesSource, /\.activity-questionnaire-section-average/);
  assert.match(manualSource, /Consultar as médias dos questionários/);
  assert.match(manualSource, /média geral e as médias de Participação/);
  assert.match(manualSource, /A interface calcula no cliente a média geral/);
});
