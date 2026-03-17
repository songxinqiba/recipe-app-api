import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { useState } from "react";
import { useAuth, useClerk, useSignUp } from "../../auth/clerk";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Image } from "expo-image";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

const VerifyEmail = ({ email, onBack }) => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { signUp } = useSignUp();
  const { setActive } = useClerk();
  const { isLoaded } = useAuth();
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);

  const handleVerification = async () => {
    if (!isLoaded) return;
    if (!code) return Alert.alert("Error", "Please enter verification code");

    setLoading(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code });
      if (verifyError) {
        const msg = verifyError?.errors?.[0]?.message || verifyError?.message || "Verification failed";
        Alert.alert("Error", msg);
        console.error(JSON.stringify(verifyError, null, 2));
        return;
      }

      if (signUp.status !== "complete") {
        const { error: finalizeError } = await signUp.finalize();
        if (finalizeError) {
          const msg = finalizeError?.errors?.[0]?.message || finalizeError?.message || "Verification not complete";
          Alert.alert("Error", msg);
          console.error(JSON.stringify(finalizeError, null, 2));
          return;
        }
      }

      if (!signUp.createdSessionId) {
        Alert.alert("Error", "Missing session after verification");
        return;
      }

      await setActive({ session: signUp.createdSessionId });
      router.replace("/");
    } catch (error) {
      Alert.alert("Error", error?.errors?.[0]?.message || "Verification failed");
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const back = onBack ?? (() => router.back());
  const emailLabel = email || params?.email || "your email";

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView
          contentContainerStyle={authStyles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={authStyles.imageContainer}>
            <Image
              source={require("../../assets/images/i3.png")}
              style={authStyles.image}
              contentFit="contain"
            />
          </View>

          <Text style={authStyles.title}>Verify your email</Text>
          <Text style={authStyles.subtitle}>
            We&apos;ve sent a verification code to {emailLabel}
          </Text>

          <View style={authStyles.formContainer}>
            <View style={authStyles.inputContainer}>
              <TextInput
                style={authStyles.textInput}
                placeholder="Enter verification code"
                placeholderTextColor={COLORS.textLight}
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <TouchableOpacity
              style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
              onPress={handleVerification}
              disabled={loading}
              activeOpacity={0.8}
            >
              <Text style={authStyles.buttonText}>
                {loading ? "Verifying..." : "Verify Email"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={authStyles.linkContainer} onPress={back}>
              <Text style={authStyles.link}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default VerifyEmail;
