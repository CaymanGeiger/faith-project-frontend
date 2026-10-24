import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
const require = createRequire(import.meta.url);
const withLauncher = require('../plugins/withAndroidLauncherInsets.cjs');

test('launcher mod affects only Android and regenerates both launcher shapes consistently', async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'hercules-launcher-'));
  try {
    const ios = { bundleIdentifier: 'com.hercules.rewards', supportsTablet: false };
    const config = withLauncher({ name: 'Hercules', slug: 'hercules', ios });
    assert.deepEqual(config.ios, ios);
    assert.equal(config.mods.ios, undefined);
    const request = { ...config, modRequest: { platformProjectRoot: directory } };
    await config.mods.android.finalized(request);
    const readIcon = (name) => readFile(path.join(directory, 'app/src/main/res/mipmap-anydpi-v26', name), 'utf8');
    const first = await readIcon('ic_launcher.xml');
    assert.equal(await readIcon('ic_launcher_round.xml'), first);
    assert.match(first, /<monochrome>/);
    assert.match(first, /@mipmap\/ic_launcher_foreground/);
    assert.match(first, /@mipmap\/ic_launcher_monochrome/);
    await config.mods.android.finalized(request);
    assert.equal(await readIcon('ic_launcher.xml'), first);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
