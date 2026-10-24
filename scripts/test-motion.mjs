import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { test } from 'node:test';
import React from 'react';
import { act, create } from 'react-test-renderer';
import ts from 'typescript';
import { sourceLoader } from './test-support/source-loader.mjs';

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const projectRoot = path.resolve(import.meta.dirname, '..');

// Keep animation completion asynchronous so tests exercise the real hook's
// mounting, cancellation and stale-completion behavior through real React.
async function drawerFixture({ visible = false, height = 844, onDismissed } = {}) {
  const animations = [];
  const sharedValues = [];
  const frames = new Map();
  let nextFrame = 0;
  let dismissed = 0;
  let callback = onDismissed ?? (() => { dismissed++; });
  let current;
  let root;

  function cancel(shared) {
    if (!shared.active) return;
    const animation = shared.active;
    shared.active = null;
    animation.cancelled = true;
    animation.callback?.(false);
  }

  function sharedValue(initial) {
    const shared = { current: initial, active: null };
    Object.defineProperty(shared, 'value', {
      get: () => shared.current,
      set(value) {
        cancel(shared);
        if (value?.kind === 'timing') {
          const animation = { ...value, shared, cancelled: false, completed: false };
          animations.push(animation);
          shared.active = animation;
        } else {
          shared.current = value;
        }
      },
    });
    sharedValues.push(shared);
    return shared;
  }

  const builder = new Proxy(function () {}, {
    apply: () => builder,
    construct: () => builder,
    get: () => () => builder,
  });
  const easing = new Proxy({}, { get: (_, name) => (...args) => ({ name, args }) });
  const reanimated = {
    Easing: easing,
    Keyframe: builder,
    LinearTransition: builder,
    FadeIn: builder,
    FadeOut: builder,
    FadeInDown: builder,
    ReduceMotion: { System: 'system', Never: 'never', Always: 'always' },
    cancelAnimation: cancel,
    runOnJS: fn => fn,
    useSharedValue(initial) {
      const value = React.useRef(null);
      if (!value.current) value.current = sharedValue(initial);
      return value.current;
    },
    useAnimatedStyle: factory => factory(),
    interpolate(value, input, output) {
      if (value <= input[0]) return output[0];
      for (let index = 1; index < input.length; index++) {
        if (value <= input[index]) {
          const progress = (value - input[index - 1]) / (input[index] - input[index - 1]);
          return output[index - 1] + progress * (output[index] - output[index - 1]);
        }
      }
      return output.at(-1);
    },
    withTiming: (target, config, completion) => ({ kind: 'timing', target, config, callback: completion }),
  };
  const load = sourceLoader({
    'react-native': { Easing: easing, useWindowDimensions: () => ({ width: 390, height }) },
    'react-native-reanimated': reanimated,
  }, {
    requestAnimationFrame: fn => { const id = ++nextFrame; frames.set(id, fn); return id; },
    cancelAnimationFrame: id => frames.delete(id),
  });
  const { useDrawerMotion } = load('src/lib/hooks/useDrawerMotion.ts');
  const { drawerMotion } = load('src/lib/motion.ts');
  function Consumer() {
    current = useDrawerMotion(visible, callback);
    return null;
  }
  await act(async () => { root = create(React.createElement(Consumer)); });

  return {
    animations, frames, sharedValues, drawerMotion,
    get current() { return current; },
    get dismissed() { return dismissed; },
    get active() { return animations.filter(animation => animation.shared.active === animation); },
    async update(next = {}) {
      if ('visible' in next) visible = next.visible;
      if ('height' in next) height = next.height;
      if ('onDismissed' in next) callback = next.onDismissed;
      await act(async () => { root.update(React.createElement(Consumer)); });
    },
    async frame() {
      await act(async () => {
        for (const [id, fn] of [...frames]) { frames.delete(id); fn(); }
      });
    },
    async finish(animation) {
      assert.equal(animation.shared.active, animation, 'only an active animation can finish');
      await act(async () => {
        animation.shared.current = animation.target;
        animation.shared.active = null;
        animation.completed = true;
        animation.callback?.(true);
      });
    },
    async deliverStaleCompletion(animation) {
      await act(async () => { animation.callback?.(true); });
    },
    async open() {
      await this.update({ visible: true });
      await this.frame();
      for (const animation of this.active) await this.finish(animation);
    },
    unmount: () => act(async () => { root.unmount(); }),
  };
}

test('drawer remains mounted through its exit and dismisses exactly once after the slide finishes', async () => {
  const f = await drawerFixture();
  assert.equal(f.current.mounted, false);
  assert.equal(f.animations.length, 0);
  await f.open();
  assert.equal(f.current.mounted, true);
  await f.update({ visible: false });
  const close = f.active.find(animation => animation.callback);
  const backdrop = f.active.find(animation => !animation.callback);
  assert.ok(close);
  assert.equal(f.current.mounted, true);
  assert.equal(f.dismissed, 0);
  await f.finish(backdrop);
  assert.equal(f.current.mounted, true, 'backdrop completion must not truncate the drawer exit');
  await f.finish(close);
  assert.equal(f.current.mounted, false);
  assert.equal(f.dismissed, 1);
  await f.deliverStaleCompletion(close);
  assert.equal(f.dismissed, 1, 'a duplicate native completion must not dismiss twice');
  await f.unmount();
});

test('reopening cancels an exit and a stale completion cannot dismiss the reopened or subsequent drawer', async () => {
  const f = await drawerFixture();
  await f.open();
  await f.update({ visible: false });
  const firstClose = f.active.find(animation => animation.callback);
  await f.update({ visible: true });
  assert.equal(firstClose.cancelled, true);
  await f.frame();
  await f.deliverStaleCompletion(firstClose);
  assert.equal(f.current.mounted, true);
  assert.equal(f.dismissed, 0);
  await f.update({ visible: false });
  const secondClose = f.active.find(animation => animation.callback);
  await f.deliverStaleCompletion(firstClose);
  assert.equal(f.current.mounted, true, 'an earlier close cannot finish the new exit');
  await f.finish(secondClose);
  assert.equal(f.current.mounted, false);
  assert.equal(f.dismissed, 1);
  await f.unmount();
});

test('unmount cancels both scheduled opening frames and running animations', async () => {
  const scheduled = await drawerFixture({ visible: true });
  assert.equal(scheduled.frames.size, 1);
  await scheduled.unmount();
  assert.equal(scheduled.frames.size, 0);
  await scheduled.frame();
  assert.equal(scheduled.animations.length, 0);

  const running = await drawerFixture();
  await running.open();
  await running.update({ visible: false });
  const closing = [...running.active];
  await running.unmount();
  assert.equal(running.active.length, 0);
  assert.ok(closing.every(animation => animation.cancelled));
  await running.deliverStaleCompletion(closing.find(animation => animation.callback));
  assert.equal(running.dismissed, 0);
});

test('the shared drawer uses viewport-sized exits and global timing on different screen sizes', async () => {
  for (const height of [568, 844, 1024]) {
    const f = await drawerFixture({ height });
    await f.open();
    const opening = [...f.animations];
    assert.ok(opening.every(animation => animation.config === f.drawerMotion.enter));
    await f.update({ visible: false });
    const closing = f.active.find(animation => animation.callback);
    assert.equal(closing.target, height * f.drawerMotion.exitViewportRatio);
    assert.ok(f.active.every(animation => animation.config === f.drawerMotion.exit));
    assert.ok(f.animations.every(animation => animation.config.reduceMotion === 'system'));
    await f.finish(closing);
    await f.unmount();
  }
});

test('an in-flight close uses the latest dismissal callback without restarting the animation', async () => {
  let first = 0;
  let latest = 0;
  const f = await drawerFixture({ onDismissed: () => { first++; } });
  await f.open();
  await f.update({ visible: false });
  const closing = f.active.find(animation => animation.callback);
  const animationCount = f.animations.length;
  await f.update({ onDismissed: () => { latest++; } });
  assert.equal(f.animations.length, animationCount);
  await f.finish(closing);
  assert.equal(first, 0);
  assert.equal(latest, 1);
  await f.unmount();
});

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const absolute = path.join(directory, entry.name);
    return entry.isDirectory() ? sourceFiles(absolute) : /\.tsx?$/.test(entry.name) ? [absolute] : [];
  });
}

test('drawer callers cannot override the shared transition, and timing definitions stay centralized', () => {
  const violations = [];
  let drawerCallers = 0;
  for (const absolute of sourceFiles(path.join(projectRoot, 'src'))) {
    const relative = path.relative(projectRoot, absolute);
    const source = ts.createSourceFile(absolute, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
    const motionConfig = relative === 'src/lib/motionConfig.ts';
    const motionAdapter = /^src\/lib\/(?:motion|feedbackMotion|headerMotion)\.ts$/.test(relative);
    const containsNumber = node => {
      if (ts.isNumericLiteral(node)) return true;
      let found = false;
      ts.forEachChild(node, child => { if (containsNumber(child)) found = true; });
      return found;
    };
    const report = (node, description) => {
      const { line } = source.getLineAndCharacterOfPosition(node.getStart(source));
      violations.push(`${relative}:${line + 1} ${description}`);
    };
    const visit = node => {
      if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === 'ModalSheet') {
        drawerCallers++;
        for (const attribute of node.attributes.properties) {
          if (ts.isJsxAttribute(attribute) && ['travelDistance', 'closeTravelDistance', 'closeDuration'].includes(attribute.name.getText(source))) {
            report(attribute, 'drawer timing or travel is overridden by a caller');
          }
        }
      }
      if (!motionConfig && ts.isPropertyAssignment(node) && node.name.getText(source) === 'duration' && containsNumber(node.initializer)) {
        report(node, 'numeric animation duration belongs in the global motion config');
      }
      if (ts.isCallExpression(node)) {
        const expression = node.expression.getText(source);
        if (!motionConfig && (/\.(duration|delay)$/.test(expression) || expression === 'withDelay') && node.arguments[0] && containsNumber(node.arguments[0])) {
          report(node, 'numeric animation timing belongs in the global motion config');
        }
        if (!motionAdapter && /^(?:Easing|NativeEasing)\./.test(expression)) {
          report(node, 'animation easing is defined outside the global motion module');
        }
      }
      ts.forEachChild(node, visit);
    };
    visit(source);
  }
  assert.ok(drawerCallers >= 3, 'chat, dealer success and training should all use the shared drawer');
  assert.match(readFileSync(path.join(projectRoot, 'src/components/ui/ModalSheet.tsx'), 'utf8'), /useDrawerMotion\(visible,\s*onDismissed\)/);
  assert.deepEqual(violations, [], violations.join('\n'));
});

function pageMotionFixture() {
  class MotionBuilder {
    constructor(keyframes) { this.keyframes = keyframes; }
    duration(value) { this.durationMs = value; return this; }
    delay(value) { this.delayMs = value; return this; }
    easing(value) { this.easingValue = value; return this; }
    reduceMotion(value) { this.reducedMotion = value; return this; }
  }
  const load = sourceLoader({
    'react-native-reanimated': {
      __esModule: true,
      default: { View: 'AnimatedView' },
      Easing: { bezier: (...points) => points },
      Keyframe: MotionBuilder,
      LinearTransition: { duration: value => new MotionBuilder().duration(value) },
      ReduceMotion: { System: 'system' },
    },
    'react-native': {
      View: 'View', Text: 'Text', Pressable: 'Pressable', ScrollView: 'ScrollView',
      Platform: { OS: 'ios' }, Keyboard: { dismiss() {} },
    },
    'react-native-safe-area-context': {
      SafeAreaView: 'SafeAreaView',
      useSafeAreaInsets: () => ({ top: 0, bottom: 34, left: 0, right: 0 }),
    },
    'lucide-react-native': { ChevronLeft: 'ChevronLeft' },
    'expo-router': { router: { canGoBack: () => true, back() {}, replace() {} } },
  });
  return { load, motion: load('src/lib/motion.ts') };
}

test('page and section entrances preserve the exact Home/Support animation and system reduced-motion setting', () => {
  const { motion } = pageMotionFixture();
  const { pageEnterMotion: page, cardRevealForIndex: card, asyncContentRevealMotion: ready } = motion;
  const plain = value => JSON.parse(JSON.stringify(value));
  assert.deepEqual(plain(page.keyframes), {
    0: { opacity: 0, transform: [{ translateX: 8 }, { translateY: 6 }] },
    100: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }], easing: [0.16, 1, 0.3, 1] },
  });
  assert.equal(page.durationMs, 252);
  assert.deepEqual(plain(card(0).keyframes), {
    0: { opacity: 0, transform: [{ translateX: 4 }, { translateY: 7 }] },
    100: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }], easing: [0.16, 1, 0.3, 1] },
  });
  for (let index = 0; index < 8; index++) {
    assert.equal(card(index).durationMs, 228);
    assert.equal(card(index).delayMs, Math.min(index, 4) * 22);
    assert.equal(card(index).reducedMotion, 'system');
  }
  assert.equal(card(-1), card(0));
  assert.equal(card(100), card(4), 'long pages must not accumulate long reveal delays');
  assert.equal(page.reducedMotion, 'system');
  assert.equal(ready.durationMs, 156);
  assert.equal(ready.reducedMotion, 'system');
  assert.equal(motion.motionConfig.native.rootNavigation, 'none', 'native navigation must not add a second page slide');
});

test('app, auth, and legal shells use one shared entrance without remounting edited content on ordinary updates', async () => {
  const { load, motion } = pageMotionFixture();
  const { AppScreen } = load('src/components/layout/AppScreen.tsx');
  const { AuthShell } = load('src/features/auth/AuthShell.tsx');
  const { LegalScreen } = load('src/features/legal/LegalScreen.tsx');
  const { PageEntrance } = load('src/components/layout/PageEntrance.tsx');
  const cases = [
    [AppScreen, { title: 'Home', quickLinks: [] }],
    [AppScreen, { title: 'Getting Started', quickLinks: [], scroll: false }],
    ...['login', 'flow', 'form'].map(variant => [AuthShell, { title: 'Account', subtitle: 'Your details', variant }]),
    [LegalScreen, { title: 'Account Deletion' }],
  ];
  for (const [Shell, props] of cases) {
    let mounts = 0;
    let unmounts = 0;
    function Draft() {
      const [value, setValue] = React.useState('');
      React.useEffect(() => { mounts++; return () => { unmounts++; }; }, []);
      return React.createElement('DraftField', { value, onChange: setValue });
    }
    let root;
    const render = title => React.createElement(Shell, { ...props, title }, React.createElement(Draft));
    try {
      await act(async () => { root = create(render(props.title)); });
      assert.equal(root.root.findAllByType(PageEntrance).length, 1, `${Shell.name} must share the page entrance`);
      const entrances = root.root.findAllByType('AnimatedView').filter(node => node.props.entering === motion.pageEnterMotion);
      assert.equal(entrances.length, 1, `${Shell.name} must have exactly one page animation owner`);
      await act(async () => { root.root.findByType('DraftField').props.onChange('unsaved details'); });
      await act(async () => { root.update(render('Updated heading')); });
      assert.equal(root.root.findByType('DraftField').props.value, 'unsaved details');
      assert.equal(mounts, 1, `${Shell.name} must not remount form content to replay an entrance`);
      assert.equal(unmounts, 0);
      assert.equal(root.root.findAllByType('AnimatedView').filter(node => node.props.entering === motion.pageEnterMotion).length, 1);
    } finally {
      if (root) await act(async () => { root.unmount(); });
    }
  }
});

test('every visible route reaches an app, auth, legal, or shared page shell', () => {
  const shells = new Set(['AppScreen', 'AuthShell', 'LegalScreen', 'PageEntrance']);
  const parsed = new Map();
  function inspect(absolute) {
    if (parsed.has(absolute)) return parsed.get(absolute);
    const source = ts.createSourceFile(absolute, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
    const tags = new Set();
    const imports = new Map();
    for (const statement of source.statements) {
      if (!ts.isImportDeclaration(statement) || !statement.importClause) continue;
      const moduleName = statement.moduleSpecifier.text;
      if (!moduleName.startsWith('.')) continue;
      const base = path.resolve(path.dirname(absolute), moduleName);
      const dependency = [base, `${base}.tsx`, `${base}.ts`, path.join(base, 'index.tsx')].find(file => existsSync(file) && /\.tsx?$/.test(file));
      if (!dependency) continue;
      if (statement.importClause.name) imports.set(statement.importClause.name.text, dependency);
      const bindings = statement.importClause.namedBindings;
      if (bindings && ts.isNamedImports(bindings)) {
        for (const binding of bindings.elements) imports.set(binding.name.text, dependency);
      }
    }
    function visit(node) {
      if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) tags.add(node.tagName.getText(source));
      ts.forEachChild(node, visit);
    }
    visit(source);
    const result = { tags, imports };
    parsed.set(absolute, result);
    return result;
  }
  function hasShell(absolute, visited = new Set()) {
    if (visited.has(absolute)) return false;
    visited.add(absolute);
    const { tags, imports } = inspect(absolute);
    return [...tags].some(tag => shells.has(tag) || (imports.has(tag) && hasShell(imports.get(tag), visited)));
  }
  const routes = sourceFiles(path.join(projectRoot, 'src/app')).filter(file => !file.endsWith('/_layout.tsx'));
  const uncovered = routes.filter(file => {
    if (path.relative(projectRoot, file) === 'src/app/index.tsx') return !inspect(file).tags.has('Redirect');
    return !hasShell(file);
  });
  assert.ok(routes.length >= 22, 'coverage must inspect the full route tree');
  assert.deepEqual(uncovered.map(file => path.relative(projectRoot, file)), [], 'visible routes must use the shared entrance, including delegated feature screens');
});
