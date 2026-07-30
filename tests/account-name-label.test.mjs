import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const readSource = (path) => readFile(new URL(path, import.meta.url), "utf8");

test("the active user name is shown below the account icon in every topbar", async () => {
  const [productionBuilder, localServer, styles, devicesApp, devicesStyles] = await Promise.all([
    readSource("../scripts/prepare-vercel-output.mjs"),
    readSource("../portal/server.py"),
    readSource("../portal/static/styles.css"),
    readSource("../portal/modules/dispositivos/src/App.tsx"),
    readSource("../portal/modules/dispositivos/src/App.css"),
  ]);

  assert.match(productionBuilder, /data-dashboard-account-label hidden/);
  assert.match(
    productionBuilder,
    /querySelectorAll\("\[data-dashboard-account-name\], \[data-dashboard-account-label\]"\)/,
  );
  assert.match(localServer, /class="dashboard-account-label"/);
  assert.match(styles, /\.dashboard-user-trigger\s*\{[\s\S]*?flex-direction:\s*column;/);
  assert.match(styles, /\.dashboard-account-label\s*\{[\s\S]*?text-overflow:\s*ellipsis;/);

  assert.match(devicesApp, /className="[^"]*portal-account-trigger[^"]*"/);
  assert.match(devicesApp, /className="portal-account-trigger-label"/);
  assert.match(devicesStyles, /\.portal-account-trigger\s*\{[\s\S]*?flex-direction:\s*column;/);
  assert.match(devicesStyles, /\.portal-account-trigger-label\s*\{[\s\S]*?text-overflow:\s*ellipsis;/);
});
