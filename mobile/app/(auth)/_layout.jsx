import { useAuth } from "../../auth/clerk";
import { Redirect, Stack } from 'expo-router'
import { ActivityIndicator, View } from "react-native";

export default function AuthRoutesLayout() {
    const { isSignedIn, isLoaded } = useAuth()

    if (!isLoaded) {
        return (
            <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                <ActivityIndicator />
            </View>
        );
    }

    if (isSignedIn) {
        return <Redirect href={'/'} />;
    }

    return <Stack screenOptions={{ headerShown: false }} />;
}
