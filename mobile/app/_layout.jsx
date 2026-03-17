import { ClerkLoaded, ClerkLoading, ClerkProvider, tokenCache } from "../auth/clerk";
import { Slot } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import SafeScreen from "../components/SafeScreen";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

export default function RootLayout() {
  const tokenCacheProps = tokenCache ? { tokenCache } : undefined;
  const [showStuckHint, setShowStuckHint] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowStuckHint(true), 8000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <ClerkProvider publishableKey={publishableKey} {...tokenCacheProps}>
      <ClerkLoading>
        <View
          style={{
            flex: 1,
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <ActivityIndicator />
          {showStuckHint && (
            <Text style={{ marginTop: 12, textAlign: "center", opacity: 0.8 }}>
              Clerk 一直加载中：请在浏览器 Network 里检查是否有请求被阻止（clerk / accounts.dev），并确认 Clerk Dashboard
              已把 `http://localhost:8081` 加到允许的开发域名/Origin。
            </Text>
          )}
        </View>
      </ClerkLoading>

      <ClerkLoaded>
        <SafeScreen>
          <Slot />
        </SafeScreen>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

