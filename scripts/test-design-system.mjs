import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const projectRoot = path.resolve(import.meta.dirname, '..');
const require = createRequire(path.join(projectRoot, 'package.json'));
const resolveTailwindConfig = require('tailwindcss/resolveConfig');
const plain = value => JSON.parse(JSON.stringify(value));
const originalTokens = JSON.parse(readFileSync(path.join(projectRoot, 'src/lib/theme/designTokens.json'), 'utf8'));

function themeFixture(tokens = originalTokens) {
  // The replacement exists only in this module loader; no real theme file or
  // company configuration is modified by this test.
  const load = sourceLoader({ './designTokens.json': tokens });
  return {
    runtime: load('src/lib/theme/theme.ts'),
    components: load('src/lib/theme/componentStyles.ts').componentStyles,
    tailwind: resolveTailwindConfig(load('tailwind.config.js')),
  };
}

test('native theme and resolved NativeWind aliases share one source of brand colors and radii', () => {
  const { runtime, tailwind } = themeFixture();
  assert.deepEqual(plain(tailwind.theme.colors.hercules), plain(runtime.colors));
  assert.equal(runtime.colors.ink, runtime.colors.blue);
  assert.equal(tailwind.theme.borderRadius.app, `${runtime.radius.card}px`);
  assert.equal(tailwind.theme.borderRadius.pill, `${runtime.radius.pill}px`);
  assert.deepEqual(plain(tailwind.theme.fontFamily.sans), originalTokens.fontFamily);
});

test('a hypothetical dealer palette propagates to native shades, shared components and NativeWind without editing app code', () => {
  const tokens = structuredClone(originalTokens);
  tokens.palette = { red: '#951245', blue: '#1264A8', white: '#FAF9F8' };
  tokens.opacity.muted = 0.42;
  tokens.opacity.drawerBackdrop = 0.23;
  tokens.radius.card = 26;
  const { runtime, components, tailwind } = themeFixture(tokens);
  assert.equal(runtime.colors.blue, '#1264A8');
  assert.equal(runtime.colors.ink, '#1264A8');
  assert.equal(runtime.colors.muted, 'rgba(18, 100, 168, 0.42)');
  assert.equal(runtime.shades.drawerBackdrop, 'rgba(18, 100, 168, 0.23)');
  assert.equal(runtime.shades.transparentRed, 'rgba(149, 18, 69, 0)');
  assert.deepEqual(plain(tailwind.theme.colors.hercules), plain(runtime.colors));
  assert.equal(tailwind.theme.borderRadius.app, '26px');
  assert.equal(components.drawer.native.backdrop.backgroundColor, runtime.shades.drawerBackdrop);
  assert.equal(components.drawer.native.sheet.shadowColor, runtime.colors.blue);
  assert.equal(components.drawer.native.sheet.backgroundColor, runtime.colors.white);
  assert.equal(components.drawer.native.sheet.borderColor, runtime.shades.softBorder);
  assert.equal(components.drawer.native.closeButton.borderColor, runtime.shades.closeBorder);
  assert.equal(components.input.unfocusedBorderColor, runtime.shades.inputBorder);
  assert.deepEqual(
    JSON.parse(readFileSync(path.join(projectRoot, 'src/lib/theme/designTokens.json'), 'utf8')),
    originalTokens,
    'the hypothetical theme must never modify the real brand tokens',
  );
});

async function sheetFixture(props) {
  const motion = { mounted: true, backdropStyle: {}, sheetStyle: {} };
  let hookArguments;
  let root;
  const load = sourceLoader({
    'react-native': {
      KeyboardAvoidingView: 'KeyboardAvoidingView', Modal: 'Modal',
      Platform: { OS: 'ios' }, Pressable: 'Pressable', Text: 'Text', View: 'View',
      StyleSheet: { create: value => value, absoluteFill: {} },
    },
    'react-native-reanimated': { View: 'AnimatedView' },
    'lucide-react-native': { X: 'X' },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 44, bottom: 34, left: 0, right: 0 }) },
    '../../lib/hooks/useDrawerMotion': { useDrawerMotion: (visible, onDismissed) => {
      hookArguments = { visible, onDismissed };
      return motion;
    } },
  });
  const { ModalSheet } = load('src/components/ui/ModalSheet.tsx');
  await act(async () => { root = create(React.createElement(ModalSheet, props)); });
  return {
    root, motion,
    get hookArguments() { return hookArguments; },
    update: next => act(async () => { root.update(React.createElement(ModalSheet, next)); }),
    unmount: () => act(async () => { root.unmount(); }),
  };
}

test('closing a drawer preserves the displayed title and content until the shared lifecycle finishes', async () => {
  for (const customTitle of [false, true]) {
    const props = {
      visible: true, title: 'First dealer', onClose() {},
      titleContent: customTitle ? React.createElement('Heading', { name: 'First dealer' }) : undefined,
      children: React.createElement('DealerDetails', { dealerId: 'first' }),
    };
    const f = await sheetFixture(props);
    const closingProps = { ...props, visible: false, title: 'Closed', titleContent: undefined, children: null };
    await f.update(closingProps);
    assert.equal(f.root.root.findByType('Modal').props.visible, true);
    assert.equal(f.root.root.findByType('DealerDetails').props.dealerId, 'first');
    if (customTitle) assert.equal(f.root.root.findByType('Heading').props.name, 'First dealer');
    else assert.equal(f.root.root.findByProps({ accessibilityRole: 'header' }).props.children, 'First dealer');
    assert.equal(f.root.root.findByProps({ accessibilityViewIsModal: true }).props.pointerEvents, 'none');
    assert.equal(f.hookArguments.visible, false);
    f.motion.mounted = false;
    await f.update(closingProps);
    assert.equal(f.root.toJSON(), null);
    f.motion.mounted = true;
    await f.update({ ...props, title: 'Next dealer', titleContent: undefined, children: React.createElement('DealerDetails', { dealerId: 'next' }) });
    assert.equal(f.root.root.findByType('DealerDetails').props.dealerId, 'next');
    assert.equal(f.root.root.findByProps({ accessibilityRole: 'header' }).props.children, 'Next dealer');
    await f.unmount();
  }
});

test('drawer close controls and dismissal callbacks keep their current handlers across prop changes', async () => {
  let staleCloses = 0;
  let currentCloses = 0;
  let dismissed = 0;
  const firstDismissal = () => { throw new Error('stale dismissal handler was invoked'); };
  const latestDismissal = () => { dismissed++; };
  const props = { visible: true, title: 'Dealer', onClose: () => { staleCloses++; }, onDismissed: firstDismissal };
  const f = await sheetFixture(props);
  assert.equal(f.hookArguments.onDismissed, firstDismissal);
  await f.update({ ...props, onClose: () => { currentCloses++; }, onDismissed: latestDismissal });
  await act(async () => {
    f.root.root.findByProps({ accessibilityLabel: 'Close' }).props.onPress();
    f.root.root.findAllByType('Pressable').find(item => !item.props.accessibilityLabel).props.onPress();
    f.root.root.findByType('Modal').props.onRequestClose();
  });
  assert.equal(staleCloses, 0);
  assert.equal(currentCloses, 3);
  assert.equal(dismissed, 0, 'a close request must not signal that the exit has already finished');
  assert.equal(f.hookArguments.onDismissed, latestDismissal);
  await act(async () => { f.hookArguments.onDismissed(); });
  assert.equal(dismissed, 1);
  await f.unmount();
});

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(absolute) : /\.(?:[cm]?[jt]sx?|css|json)$/.test(entry.name) ? [absolute] : [];
  });
}

test('app source cannot bypass the shared palette with raw color literals', () => {
  const violations = [];
  for (const absolute of sourceFiles(path.join(projectRoot, 'src'))) {
    const relative = path.relative(projectRoot, absolute);
    if (['src/lib/theme/designTokens.json', 'src/lib/theme/designTokens.cjs'].includes(relative)) continue;
    const source = readFileSync(absolute, 'utf8');
    for (const match of source.matchAll(/#[\da-f]{3,8}\b|\b(?:rgb|hsl)a?\(\s*[\d.]/gi)) {
      const line = source.slice(0, match.index).split('\n').length;
      violations.push(`${relative}:${line}`);
    }
  }
  assert.deepEqual(violations, [], `Raw colors must be declared in the shared tokens: ${violations.join(', ')}`);
});
