import assert from 'node:assert/strict';
import { test } from 'node:test';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
test('patched query decoder preserves URLs and handles malformed hostile input', () => {
  const query = require('query-string');
  assert.equal(query.parse('q=heat%20pump&name=%F0%9F%8C%9F').q, 'heat pump');
  assert.equal(query.parse('name=%F0%9F%8C%9F').name, '🌟');
  assert.equal(query.parse('q=a%2Bb').q, 'a+b');
  assert.equal(query.parse('q=a+b').q, 'a b');
  const input = '%EA%EA%A5'.repeat(10000);
  const result = query.parse(`q=${input}`);
  assert.equal(typeof result.q, 'string');
});
test('patched UUID retains the Xcode project ID API', () => {
  const xcode = require('xcode');
  const project = xcode.project('unused-test.pbxproj');
  project.hash = { project: { objects: {} } };
  const first = project.generateUuid(); const second = project.generateUuid();
  assert.match(first, /^[A-F0-9]{24}$/); assert.notEqual(first, second);
  assert.equal(typeof require('@expo/ngrok').connect, 'function');
});
