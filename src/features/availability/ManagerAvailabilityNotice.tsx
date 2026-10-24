import { useEffect, useState } from "react";
import { AppState, Text, View } from "react-native";
import { availabilityApi, type ManagerAvailability } from "./availabilityApi";

export function ManagerAvailabilityNotice({
  conversationId,
}: {
  conversationId: string;
}) {
  const [availability, setAvailability] = useState<ManagerAvailability | null>(
    null,
  );
  const [unverified, setUnverified] = useState(false);
  useEffect(() => {
    let active = true;
    let version = 0;
    setAvailability(null);
    setUnverified(false);
    const refresh = async () => {
      const request = ++version;
      try {
        const result = await availabilityApi.conversation(conversationId);
        if (active && request === version) {
          setAvailability(result.availability);
          setUnverified(false);
        }
      } catch {
        if (active && request === version) {
          setAvailability(null);
          setUnverified(true);
        }
      }
    };
    void refresh();
    const foreground = AppState.addEventListener("change", (next) => {
      if (next === "active") void refresh();
    });
    const timer = setInterval(() => {
      if (AppState.currentState === "active") void refresh();
    }, 15_000);
    return () => {
      active = false;
      foreground.remove();
      clearInterval(timer);
    };
  }, [conversationId]);
  if (unverified)
    return (
      <Text className="text-xs text-hercules-muted">
        Manager availability could not be checked. You can still send a message.
      </Text>
    );
  if (!availability?.notice) return null;
  return (
    <View className="rounded-xl border border-hercules-blue/15 bg-hercules-blue/5 p-3">
      <Text accessibilityRole="alert" className="text-sm text-hercules-ink">
        {availability.notice}
      </Text>
    </View>
  );
}
