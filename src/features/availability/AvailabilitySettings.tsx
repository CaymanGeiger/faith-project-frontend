import { useEffect, useRef, useState } from "react";
import { AppState, Pressable, Switch, Text, View } from "react-native";
import { PrimaryButton } from "../../components/ui/PrimaryButton";
import { TextInput } from "../../components/ui/TextInput";
import { ErrorState } from "../../components/ui/StateViews";
import {
  availabilityApi,
  DEFAULT_OUT_OF_OFFICE_MESSAGE,
  type AvailabilitySettings as Settings,
  type ManagerAvailability,
} from "./availabilityApi";

const days = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
export function AvailabilitySettings() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [availability, setAvailability] = useState<ManagerAvailability | null>(
    null,
  );
  const [choice, setChoice] = useState<Settings["mode"]>("SCHEDULE");
  const [scheduleEnabled, setScheduleEnabled] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [dirty, setDirty] = useState(false);
  const inFlight = useRef(false);
  const initialized = useRef(false);
  const mounted = useRef(true);
  const requestVersion = useRef(0);
  const overrideChanged = useRef(false);

  useEffect(() => {
    mounted.current = true;
    const refresh = async () => {
      if (inFlight.current) return;
      const version = ++requestVersion.current;
      try {
        const response = await availabilityApi.own();
        if (!mounted.current || version !== requestVersion.current) return;
        setAvailability(response.availability);
        if (!overrideChanged.current) {
          setChoice(response.availability.effectiveMode);
          setSettings((current) =>
            current
              ? {
                  ...current,
                  mode: response.settings.mode,
                  overrideUntil: response.settings.overrideUntil,
                }
              : current,
          );
        }
        if (!initialized.current) {
          initialized.current = true;
          setSettings(response.settings);
          setScheduleEnabled(Boolean(response.settings.timezone));
          setError(null);
        }
      } catch (caught) {
        if (
          mounted.current &&
          version === requestVersion.current &&
          !initialized.current
        )
          setError(
            caught instanceof Error
              ? caught.message
              : "Unable to load availability.",
          );
      }
    };
    void refresh();
    const foreground = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 30_000);
    return () => {
      mounted.current = false;
      requestVersion.current++;
      foreground.remove();
      clearInterval(timer);
    };
  }, []);

  const change = (next: Settings) => {
    setSettings(next);
    setSaved(false);
    setDirty(true);
  };
  const changeMode = (mode: Settings["mode"]) => {
    overrideChanged.current = true;
    setChoice(mode);
    setSaved(false);
    setDirty(true);
  };
  const save = async () => {
    if (!settings || inFlight.current) return;
    if (scheduleEnabled && !settings.timezone?.trim()) {
      setError("Enter a time zone for your weekly hours.");
      return;
    }
    if (
      scheduleEnabled &&
      settings.hours.some(
        (hours) =>
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours.start) ||
          !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(hours.end) ||
          hours.start === hours.end,
      )
    ) {
      setError(
        "Enter different opening and closing times in 24-hour HH:MM format for each open day.",
      );
      return;
    }
    inFlight.current = true;
    requestVersion.current++;
    setBusy(true);
    setError(null);
    setSaved(false);
    try {
      const message = settings.outOfOfficeMessage?.trim();
      const overrideExpired = Boolean(
        settings.overrideUntil &&
          new Date(settings.overrideUntil).getTime() <= Date.now(),
      );
      const response = await availabilityApi.update({
        ...settings,
        outOfOfficeMessage:
          message && message !== DEFAULT_OUT_OF_OFFICE_MESSAGE ? message : null,
        mode:
          !overrideChanged.current && overrideExpired
            ? "SCHEDULE"
            : choice,
        overrideUntil:
          !overrideChanged.current && !overrideExpired
            ? settings.overrideUntil
            : null,
      });
      if (!mounted.current) return;
      setSettings(response.settings);
      setAvailability(response.availability);
      setChoice(response.availability.effectiveMode);
      overrideChanged.current = false;
      setSaved(true);
      setDirty(false);
    } catch (caught) {
      if (mounted.current)
        setError(
          caught instanceof Error
            ? caught.message
            : "Unable to save availability.",
        );
    } finally {
      inFlight.current = false;
      if (mounted.current) setBusy(false);
    }
  };

  return (
    <View className="gap-4 rounded-[16px] border border-hercules-blue/15 bg-hercules-white p-4">
      <Text
        accessibilityRole="header"
        className="text-xl font-extrabold text-hercules-ink"
      >
        Chat availability
      </Text>
      <Text className="text-base text-hercules-muted">
        Let dealers know when you're away. Messages can still be sent at any
        time.
      </Text>
      {error ? <ErrorState message={error} /> : null}
      {!settings ? (
        <Text className="text-sm text-hercules-muted">
          {error
            ? "Availability will retry when you return to this screen."
            : "Loading availability…"}
        </Text>
      ) : (
        <>
          <View className="gap-1 rounded-xl bg-hercules-blue/5 p-3">
            <Text className="text-sm text-hercules-muted">
              Status dealers see
            </Text>
            <Text
              accessibilityLiveRegion="polite"
              className="text-base font-semibold text-hercules-ink"
            >
              {availability?.available
                ? "Available"
                : availability?.effectiveMode === "AWAY"
                  ? "Out of office"
                  : "Outside working hours"}
            </Text>
          </View>
          {dirty ? (
            <Text
              accessibilityLiveRegion="polite"
              className="text-sm text-hercules-muted"
            >
              Unsaved changes. Save to update your availability.
            </Text>
          ) : null}
          <View className="gap-1">
            <View className="min-h-12 flex-row items-center justify-between gap-3">
              <Text className="flex-1 text-base font-semibold text-hercules-ink">
                Out of office
              </Text>
              <Switch
                accessibilityLabel="Out of office"
                disabled={busy}
                value={choice === "AWAY"}
                onValueChange={(away) => changeMode(away ? "AWAY" : "SCHEDULE")}
              />
            </View>
            <Text className="text-sm text-hercules-muted">
              {choice === "AWAY"
                ? "Keep this on while you're away, then turn it off when you're back."
                : "Turn on for vacations, appointments, or other time away."}
            </Text>
            {settings.overrideUntil &&
            !overrideChanged.current &&
            availability?.effectiveMode !== "SCHEDULE" ? (
              <Text className="text-sm text-hercules-muted">
                {choice === "AWAY"
                  ? "Scheduled to turn off"
                  : "Weekly hours resume"}{" "}
                {new Date(settings.overrideUntil).toLocaleString()}.
              </Text>
            ) : null}
          </View>
          {choice === "AVAILABLE" && scheduleEnabled ? (
            <View className="gap-1">
              <Text className="text-sm text-hercules-muted">
                You're currently marked available outside your weekly hours.
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Resume weekly hours"
                disabled={busy}
                onPress={() => changeMode("SCHEDULE")}
                className="min-h-12 justify-center self-start rounded-xl px-3 py-2 active:opacity-70"
              >
                <Text className="text-sm font-semibold text-hercules-blue">
                  Resume weekly hours
                </Text>
              </Pressable>
            </View>
          ) : null}
          <View className="gap-2">
            <TextInput
              label="Out-of-office message"
              value={
                settings.outOfOfficeMessage ?? DEFAULT_OUT_OF_OFFICE_MESSAGE
              }
              editable={!busy}
              multiline
              maxLength={500}
              autoCapitalize="sentences"
              onChangeText={(outOfOfficeMessage) =>
                change({ ...settings, outOfOfficeMessage })
              }
            />
            <Text className="text-sm text-hercules-muted">
              Dealers see this when you're out of office or outside your weekly
              hours. Leave blank to use the default message.
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Use default message"
              disabled={busy}
              onPress={() => change({ ...settings, outOfOfficeMessage: null })}
              className="min-h-11 justify-center self-start rounded-xl px-3 py-2 active:opacity-70"
            >
              <Text className="text-sm font-semibold text-hercules-blue">
                Use default message
              </Text>
            </Pressable>
          </View>
          <View className="min-h-12 flex-row items-center justify-between gap-3 border-t border-hercules-blue/10 pt-3">
            <Text className="flex-1 text-base font-semibold text-hercules-ink">
              Use weekly hours
            </Text>
            <Switch
              accessibilityLabel="Use weekly hours"
              disabled={busy}
              value={scheduleEnabled}
              onValueChange={(enabled) => {
                setScheduleEnabled(enabled);
                if (choice === "AVAILABLE") changeMode("SCHEDULE");
                change({
                  ...settings,
                  timezone: enabled
                    ? settings.timezone ||
                      Intl.DateTimeFormat().resolvedOptions().timeZone ||
                      "UTC"
                    : null,
                  hours: enabled ? settings.hours : [],
                });
              }}
            />
          </View>
          {scheduleEnabled ? (
            <>
              <Text className="text-sm text-hercules-muted">
                Your away message appears automatically outside these hours.
                {choice === "AWAY"
                  ? " Turn off Out of office to resume this schedule."
                  : ""}
              </Text>
              <TextInput
                label="Time zone"
                value={settings.timezone ?? ""}
                editable={!busy}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="America/Denver"
                onChangeText={(timezone) => change({ ...settings, timezone })}
              />
              <Text className="text-sm text-hercules-muted">
                Use 24-hour times. A closing time earlier than opening ends the
                following day. Days without hours are closed.
              </Text>
              {days.map((day, index) => {
                const hours = settings.hours.find((item) => item.day === index);
                const updateTime = (field: "start" | "end", value: string) =>
                  change({
                    ...settings,
                    hours: settings.hours.map((item) =>
                      item.day === index ? { ...item, [field]: value } : item,
                    ),
                  });
                return (
                  <View
                    key={day}
                    className="gap-2 border-t border-hercules-blue/10 pt-3"
                  >
                    <View className="flex-row items-center justify-between gap-3">
                      <Text className="text-base font-semibold text-hercules-ink">
                        {day}
                      </Text>
                      <Switch
                        accessibilityLabel={`${day} open`}
                        disabled={busy}
                        value={Boolean(hours)}
                        onValueChange={(open) =>
                          change({
                            ...settings,
                            hours: open
                              ? [
                                  ...settings.hours,
                                  { day: index, start: "", end: "" },
                                ]
                              : settings.hours.filter(
                                  (item) => item.day !== index,
                                ),
                          })
                        }
                      />
                    </View>
                    {hours ? (
                      <View className="flex-row gap-3">
                        <View className="flex-1">
                          <TextInput
                            compact
                            label={`${day} opens`}
                            value={hours.start}
                            editable={!busy}
                            placeholder="HH:MM"
                            maxLength={5}
                            autoCapitalize="none"
                            onChangeText={(value) => updateTime("start", value)}
                          />
                        </View>
                        <View className="flex-1">
                          <TextInput
                            compact
                            label={`${day} closes`}
                            value={hours.end}
                            editable={!busy}
                            placeholder="HH:MM"
                            maxLength={5}
                            autoCapitalize="none"
                            onChangeText={(value) => updateTime("end", value)}
                          />
                        </View>
                      </View>
                    ) : null}
                  </View>
                );
              })}
            </>
          ) : (
            <Text className="text-sm text-hercules-muted">
              You're available whenever Out of office is off. Add weekly hours
              to show your away message automatically after work.
            </Text>
          )}
          <View className="flex-row items-center justify-between gap-3">
            <Text className="flex-1 text-base font-semibold text-hercules-ink">
              Mute chat notifications while away
            </Text>
            <Switch
              accessibilityLabel="Mute chat notifications while away"
              disabled={busy}
              value={settings.silenceWhenUnavailable}
              onValueChange={(silenceWhenUnavailable) =>
                change({ ...settings, silenceWhenUnavailable })
              }
            />
          </View>
          <Text className="text-sm text-hercules-muted">
            Push notifications pause while you're away. You can still read and
            reply to messages.
          </Text>
          {saved ? (
            <Text
              accessibilityRole="alert"
              className="text-sm font-semibold text-hercules-blue"
            >
              Availability saved.
            </Text>
          ) : null}
          <PrimaryButton
            label="Save Availability"
            loading={busy}
            onPress={() => void save()}
          />
        </>
      )}
    </View>
  );
}
