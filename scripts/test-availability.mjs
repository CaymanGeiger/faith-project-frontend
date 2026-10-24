import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { act, create } from "react-test-renderer";
import { sourceLoader } from "./test-support/source-loader.mjs";

globalThis.IS_REACT_ACT_ENVIRONMENT = true;
const defaultSettings = {
  timezone: null,
  hours: [],
  mode: "SCHEDULE",
  overrideUntil: null,
  silenceWhenUnavailable: false,
  outOfOfficeMessage: null,
};
const availability = {
  available: true,
  effectiveMode: "SCHEDULE",
  notice: null,
  sendingAllowed: true,
  notificationsSilenced: false,
  evaluatedAt: new Date().toISOString(),
};
const notice =
  "This is outside of normal business hours. There may be a delayed response.";

async function settingsFixture({
  initial = defaultSettings,
  initialAvailability,
  update,
} = {}) {
  const calls = [],
    timers = [];
  let now = Date.now();
  let serverSettings = initial;
  let serverAvailability = initialAvailability;
  class ClockDate extends Date {
    constructor(...args) {
      super(...(args.length ? args : [now]));
    }
    static now() {
      return now;
    }
  }
  const responseFor = (settings) => {
    const effectiveMode =
      settings.overrideUntil && new Date(settings.overrideUntil).getTime() <= now
        ? "SCHEDULE"
        : settings.mode;
    return {
      settings,
      availability: {
        ...availability,
        available: effectiveMode !== "AWAY",
        effectiveMode,
        ...serverAvailability,
      },
    };
  };
  const load = sourceLoader(
    {
      "react-native": {
        Text: "Text",
        View: "View",
        Pressable: "Pressable",
        Switch: "Switch",
        AppState: {
          currentState: "active",
          addEventListener: () => ({ remove() {} }),
        },
      },
      "../../components/ui/TextInput": { TextInput: "Input" },
      "../../components/ui/PrimaryButton": { PrimaryButton: "Primary" },
      "../../components/ui/StateViews": { ErrorState: "Error" },
      "./availabilityApi": {
        DEFAULT_OUT_OF_OFFICE_MESSAGE: notice,
        availabilityApi: {
          own: async () => responseFor(serverSettings),
          update: async (settings) => {
            calls.push(JSON.parse(JSON.stringify(settings)));
            if (update) return update(settings);
            serverSettings = settings;
            return responseFor(settings);
          },
        },
      },
    },
    {
      Date: ClockDate,
      setInterval: (callback) => {
        timers.push(callback);
        return timers.length;
      },
      clearInterval: () => {},
    },
  );
  const { AvailabilitySettings } = load(
    "src/features/availability/AvailabilitySettings.tsx",
  );
  let root;
  await act(async () => {
    root = create(React.createElement(AvailabilitySettings));
  });
  const field = (label) =>
    root.root.findAllByType("Input").find((node) => node.props.label === label);
  return {
    root,
    calls,
    field,
    text: () =>
      root.root
        .findAllByType("Text")
        .map((node) =>
          Array.isArray(node.props.children)
            ? node.props.children.flat(Infinity).join("")
            : node.props.children,
        )
        .join("\n"),
    switchValue: (label) =>
      root.root.findByProps({ accessibilityLabel: label }).props.value,
    status: () =>
      root.root
        .findAllByType("Text")
        .find(
          (node) =>
            node.props.accessibilityLiveRegion === "polite" &&
            ["Available", "Out of office", "Outside working hours"].includes(
              node.props.children,
            ),
        )?.props.children,
    advance: (milliseconds) => {
      now += milliseconds;
    },
    setServerAvailability: (value) => {
      serverAvailability = value;
    },
    toggle: (label, value) =>
      act(async () =>
        root.root
          .findByProps({ accessibilityLabel: label })
          .props.onValueChange(value),
      ),
    input: (label, value) =>
      act(async () => field(label).props.onChangeText(value)),
    choice: (label) =>
      act(async () =>
        root.root
          .findAllByType("Pressable")
          .find((node) => node.findByType("Text").props.children === label)
          .props.onPress(),
      ),
    save: () =>
      act(async () => root.root.findByType("Primary").props.onPress()),
    refresh: () => act(async () => timers[0]()),
    close: () => act(async () => root.unmount()),
  };
}

test("availability initially preserves sending and alert behavior until the manager saves choices", async () => {
  const f = await settingsFixture();
  assert.deepEqual(f.calls, []);
  assert.match(f.text(), /Messages can still be sent/);
  assert.equal(f.switchValue("Use weekly hours"), false);
  assert.equal(f.switchValue("Out of office"), false);
  assert.equal(f.switchValue("Mute chat notifications while away"), false);
  assert.equal(
    f.root.root.findAllByProps({ accessibilityRole: "radio" }).length,
    0,
  );
  assert.doesNotMatch(
    f.text(),
    /Available until I change it|Away until I change it|Sleep for 1 hour|Follow scheduled hours/,
  );
  await f.toggle("Out of office", true);
  await f.toggle("Mute chat notifications while away", true);
  assert.deepEqual(f.calls, []);
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...defaultSettings,
    mode: "AWAY",
    silenceWhenUnavailable: true,
  });
  await f.close();
});

test("manager configures a timezone and overnight hours without assumed opening times", async () => {
  const f = await settingsFixture();
  await f.toggle("Use weekly hours", true);
  await f.input("Time zone", "");
  assert.ok(
    f.root.root
      .findAllByType("Input")
      .find((node) => node.props.label === "Time zone"),
  );
  await f.save();
  assert.equal(f.calls.length, 0);
  await f.input("Time zone", "America/Denver");
  await f.toggle("Monday open", true);
  await f.save();
  assert.equal(f.calls.length, 0);
  await f.input("Monday opens", "22:00");
  await f.input("Monday closes", "02:00");
  await f.save();
  assert.deepEqual(f.calls[0].hours, [
    { day: 1, start: "22:00", end: "02:00" },
  ]);
  assert.equal(f.calls[0].timezone, "America/Denver");
  await f.close();
});

test("out-of-office changes remain drafts until saving and turning it off resumes the schedule", async () => {
  const f = await settingsFixture();
  assert.match(f.text(), /Status dealers see/);
  assert.equal(f.status(), "Available");
  await f.toggle("Out of office", true);
  assert.equal(f.switchValue("Out of office"), true);
  assert.equal(f.status(), "Available");
  assert.match(f.text(), /Unsaved changes\. Save to update your availability\./);
  assert.deepEqual(f.calls, []);
  await f.save();
  assert.equal(f.calls[0].mode, "AWAY");
  assert.equal(f.calls[0].overrideUntil, null);
  assert.equal(f.status(), "Out of office");
  assert.doesNotMatch(f.text(), /Unsaved changes/);
  await f.toggle("Out of office", false);
  assert.equal(f.switchValue("Out of office"), false);
  assert.equal(f.status(), "Out of office");
  assert.equal(f.calls.length, 1);
  await f.save();
  assert.equal(f.calls[1].mode, "SCHEDULE");
  assert.equal(f.calls[1].overrideUntil, null);
  assert.equal(f.status(), "Available");
  await f.close();
});

test("scheduled status refreshes without changing a pending out-of-office selection", async () => {
  const f = await settingsFixture({
    initial: {
      ...defaultSettings,
      timezone: "America/Denver",
      hours: [{ day: 1, start: "09:00", end: "17:00" }],
    },
    initialAvailability: { available: false, effectiveMode: "SCHEDULE" },
  });
  assert.equal(f.switchValue("Out of office"), false);
  assert.equal(f.status(), "Outside working hours");
  await f.toggle("Out of office", true);
  f.setServerAvailability({ available: true, effectiveMode: "SCHEDULE" });
  await f.refresh();
  assert.equal(f.switchValue("Out of office"), true);
  assert.equal(f.status(), "Available");
  assert.deepEqual(f.calls, []);
  await f.close();
});

test("an existing timed absence stays on and unrelated alert edits preserve its expiration", async () => {
  const initial = {
    ...defaultSettings,
    mode: "AWAY",
    overrideUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
  };
  const f = await settingsFixture({ initial });
  assert.equal(f.switchValue("Out of office"), true);
  await f.toggle("Mute chat notifications while away", true);
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...initial,
    silenceWhenUnavailable: true,
  });
  await f.toggle("Out of office", false);
  await f.save();
  assert.equal(f.calls[1].mode, "SCHEDULE");
  assert.equal(f.calls[1].overrideUntil, null);
  await f.close();
});

test("expiry refresh turns off an untouched out-of-office switch while preserving a message draft", async () => {
  const f = await settingsFixture({
    initial: {
      ...defaultSettings,
      mode: "AWAY",
      overrideUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
    },
  });
  await f.input("Out-of-office message", "Please contact our service team.");
  f.advance(31 * 60_000);
  await f.refresh();
  assert.equal(f.switchValue("Out of office"), false);
  assert.equal(f.status(), "Available");
  assert.equal(
    f.field("Out-of-office message").props.value,
    "Please contact our service team.",
  );
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...defaultSettings,
    outOfOfficeMessage: "Please contact our service team.",
  });
  await f.close();
});

test("expiry refresh preserves a locally changed out-of-office switch and saves it without a timer", async () => {
  const f = await settingsFixture({
    initial: {
      ...defaultSettings,
      mode: "AWAY",
      overrideUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
    },
  });
  await f.toggle("Out of office", false);
  await f.toggle("Out of office", true);
  f.advance(31 * 60_000);
  await f.refresh();
  assert.equal(f.switchValue("Out of office"), true);
  assert.equal(f.status(), "Available");
  assert.deepEqual(f.calls, []);
  await f.save();
  assert.equal(f.calls[0].mode, "AWAY");
  assert.equal(f.calls[0].overrideUntil, null);
  await f.close();
});

test("existing manual availability survives unrelated saves and can explicitly resume weekly hours", async () => {
  const initial = {
    ...defaultSettings,
    timezone: "America/Denver",
    hours: [{ day: 1, start: "09:00", end: "17:00" }],
    mode: "AVAILABLE",
    outOfOfficeMessage: "Back tomorrow.",
  };
  const f = await settingsFixture({ initial });
  assert.equal(f.switchValue("Out of office"), false);
  await f.input("Out-of-office message", "Back on Monday.");
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...initial,
    outOfOfficeMessage: "Back on Monday.",
  });
  await f.choice("Resume weekly hours");
  assert.equal(f.calls.length, 1);
  await f.save();
  assert.deepEqual(f.calls[1], {
    ...initial,
    mode: "SCHEDULE",
    outOfOfficeMessage: "Back on Monday.",
  });
  await f.close();
});

test("changing weekly hours resumes the schedule from existing manual availability", async () => {
  const f = await settingsFixture({
    initial: { ...defaultSettings, mode: "AVAILABLE" },
  });
  await f.toggle("Use weekly hours", true);
  await f.input("Time zone", "America/Denver");
  await f.toggle("Monday open", true);
  await f.input("Monday opens", "09:00");
  await f.input("Monday closes", "17:00");
  await f.save();
  assert.equal(f.calls[0].mode, "SCHEDULE");
  assert.equal(f.calls[0].overrideUntil, null);
  await f.close();
});

test("disabling weekly hours keeps an existing timed absence and its expiration", async () => {
  const initial = {
    ...defaultSettings,
    timezone: "America/Denver",
    hours: [{ day: 1, start: "09:00", end: "17:00" }],
    mode: "AWAY",
    overrideUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
  };
  const f = await settingsFixture({ initial });
  await f.toggle("Use weekly hours", false);
  await f.save();
  assert.deepEqual(f.calls[0], { ...initial, timezone: null, hours: [] });
  assert.equal(f.switchValue("Out of office"), true);
  await f.close();
});

test("out-of-office message starts with the default and saves an edited message", async () => {
  const f = await settingsFixture();
  const input = f.field("Out-of-office message");
  assert.equal(input.props.value, notice);
  assert.equal(input.props.multiline, true);
  assert.equal(input.props.maxLength, 500);
  await f.input(
    "Out-of-office message",
    "  Back on Monday.\nPlease leave a message.  ",
  );
  assert.deepEqual(f.calls, []);
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...defaultSettings,
    outOfOfficeMessage: "Back on Monday.\nPlease leave a message.",
  });
  assert.equal(
    f.field("Out-of-office message").props.value,
    "Back on Monday.\nPlease leave a message.",
  );
  await f.close();
});

test("editing an existing out-of-office message preserves hours and active absence expiration", async () => {
  const initial = {
    ...defaultSettings,
    timezone: "America/Denver",
    hours: [{ day: 1, start: "09:00", end: "17:00" }],
    mode: "AWAY",
    overrideUntil: new Date(Date.now() + 30 * 60_000).toISOString(),
    silenceWhenUnavailable: true,
    outOfOfficeMessage: "At a meeting until noon.",
  };
  const f = await settingsFixture({ initial });
  assert.equal(
    f.field("Out-of-office message").props.value,
    initial.outOfOfficeMessage,
  );
  await f.input("Out-of-office message", "Meeting extended until 1 PM.");
  await f.save();
  assert.deepEqual(f.calls[0], {
    ...initial,
    outOfOfficeMessage: "Meeting extended until 1 PM.",
  });
  await f.close();
});

test("restoring the default out-of-office message takes effect only after saving", async () => {
  const initial = {
    ...defaultSettings,
    mode: "AWAY",
    outOfOfficeMessage: "Back tomorrow.",
  };
  const f = await settingsFixture({ initial });
  await f.input("Out-of-office message", "Back next week.");
  await f.choice("Use default message");
  assert.equal(f.field("Out-of-office message").props.value, notice);
  assert.deepEqual(f.calls, []);
  await f.save();
  assert.deepEqual(f.calls[0], { ...initial, outOfOfficeMessage: null });
  assert.equal(f.field("Out-of-office message").props.value, notice);
  await f.close();
});

for (const [label, value] of [
  ["empty", ""],
  ["whitespace-only", " \n\t "],
  ["default", notice],
]) {
  test(`saving the ${label} out-of-office message restores the default`, async () => {
    const f = await settingsFixture({
      initial: { ...defaultSettings, outOfOfficeMessage: "Back tomorrow." },
    });
    await f.input("Out-of-office message", value);
    await f.save();
    assert.equal(f.calls[0].outOfOfficeMessage, null);
    assert.equal(f.field("Out-of-office message").props.value, notice);
    await f.close();
  });
}

test("failed message save retains the draft through refresh and allows retry", async () => {
  let attempts = 0;
  const f = await settingsFixture({
    update: async (settings) => {
      if (++attempts === 1) throw new Error("Connection interrupted");
      return { settings, availability };
    },
  });
  const draft = "Away for the holiday; back Tuesday.";
  await f.input("Out-of-office message", draft);
  await f.save();
  assert.equal(
    f.root.root.findByType("Error").props.message,
    "Connection interrupted",
  );
  assert.equal(f.field("Out-of-office message").props.value, draft);
  await f.refresh();
  assert.equal(f.field("Out-of-office message").props.value, draft);
  await f.save();
  assert.equal(f.calls.length, 2);
  assert.equal(f.calls[1].outOfOfficeMessage, draft);
  assert.equal(f.root.root.findAllByType("Error").length, 0);
  assert.equal(f.field("Out-of-office message").props.value, draft);
  await f.close();
});

test("failed out-of-office save retains the selected switch through refresh and permits retry", async () => {
  let attempts = 0;
  const f = await settingsFixture({
    update: async (settings) => {
      if (++attempts === 1) throw new Error("Connection interrupted");
      return {
        settings,
        availability: { ...availability, available: false, effectiveMode: "AWAY" },
      };
    },
  });
  await f.toggle("Out of office", true);
  await f.save();
  await f.refresh();
  assert.equal(f.switchValue("Out of office"), true);
  assert.equal(f.status(), "Available");
  assert.match(f.text(), /Unsaved changes/);
  await f.save();
  assert.equal(f.calls.length, 2);
  assert.deepEqual(f.calls[1], { ...defaultSettings, mode: "AWAY" });
  assert.equal(f.status(), "Out of office");
  assert.equal(f.root.root.findAllByType("Error").length, 0);
  await f.close();
});

test("saving prevents duplicate requests and permits retry after failure", async () => {
  let reject;
  const f = await settingsFixture({
    update: () =>
      new Promise((_, fail) => {
        reject = fail;
      }),
  });
  await act(async () => {
    f.root.root.findByType("Primary").props.onPress();
    f.root.root.findByType("Primary").props.onPress();
  });
  assert.equal(f.calls.length, 1);
  assert.equal(f.root.root.findByType("Primary").props.loading, true);
  await act(async () => reject(new Error("Connection interrupted")));
  assert.equal(
    f.root.root.findByType("Error").props.message,
    "Connection interrupted",
  );
  assert.equal(f.root.root.findByType("Primary").props.loading, false);
  await f.close();
});

test("dealer sees custom notices update on polling and foreground and clears unavailable status on read failure", async () => {
  let state = { ...availability, available: false, notice },
    listener,
    poll,
    fail = false,
    root;
  const requests = [];
  const load = sourceLoader(
    {
      "react-native": {
        Text: "Text",
        View: "View",
        AppState: {
          currentState: "active",
          addEventListener: (_, callback) => {
            listener = callback;
            return { remove() {} };
          },
        },
      },
      "./availabilityApi": {
        availabilityApi: {
          conversation: async (id) => {
            requests.push(id);
            if (fail) throw new Error("offline");
            return { managerId: "manager", availability: state };
          },
        },
      },
    },
    {
      setInterval: (callback, interval) => {
        assert.equal(interval, 15_000);
        poll = callback;
        return 1;
      },
      clearInterval: () => {},
    },
  );
  const { ManagerAvailabilityNotice } = load(
    "src/features/availability/ManagerAvailabilityNotice.tsx",
  );
  await act(async () => {
    root = create(
      React.createElement(ManagerAvailabilityNotice, {
        conversationId: "own-chat",
      }),
    );
  });
  assert.ok(JSON.stringify(root.toJSON()).includes(notice));
  state = { ...state, notice: "Out of the office until Monday." };
  await act(async () => poll());
  assert.ok(JSON.stringify(root.toJSON()).includes(state.notice));
  assert.ok(!JSON.stringify(root.toJSON()).includes(notice));
  state = { ...state, notice: "Now returning Tuesday morning." };
  await act(async () => listener("active"));
  assert.ok(JSON.stringify(root.toJSON()).includes(state.notice));
  state = availability;
  await act(async () => listener("active"));
  assert.equal(root.toJSON(), null);
  fail = true;
  await act(async () => listener("active"));
  assert.ok(
    JSON.stringify(root.toJSON()).includes("You can still send a message."),
  );
  assert.ok(requests.every((id) => id === "own-chat"));
  await act(async () => root.unmount());
});
