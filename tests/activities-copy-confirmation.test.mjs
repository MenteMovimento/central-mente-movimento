import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const appSource = await readFile(new URL("../portal/static/app.js", import.meta.url), "utf8");

test("copying the previous week requires explicit confirmation", () => {
  const functionStart = appSource.indexOf("const copyPreviousWeekActivities = async (button) => {");
  const functionEnd = appSource.indexOf("\n};", functionStart);
  const functionSource = appSource.slice(functionStart, functionEnd);

  assert.notEqual(functionStart, -1, "copy function should exist");
  assert.match(
    functionSource,
    /window\.confirm\(getTranslation\("activities\.copyPreviousWeekConfirm"\)\)/,
  );
  assert.ok(
    functionSource.indexOf("window.confirm") < functionSource.indexOf("upsertActivityEntriesRemote"),
    "confirmation must happen before any schedule entry is saved",
  );
});

test("copy confirmation is translated in Portuguese and English", () => {
  assert.equal(appSource.match(/^\s*"activities\.copyPreviousWeekConfirm":/gm)?.length, 2);
});
