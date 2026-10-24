import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('patched UUID retains the Xcode project ID API', () => {
  const xcode = require('xcode');
  const project = xcode.project('unused-test.pbxproj');
  project.hash = { project: { objects: {} } };
  const first = project.generateUuid(); const second = project.generateUuid();
  assert.match(first, /^[A-F0-9]{24}$/); assert.notEqual(first, second);
  assert.equal(typeof require('@expo/ngrok').connect, 'function');
});
