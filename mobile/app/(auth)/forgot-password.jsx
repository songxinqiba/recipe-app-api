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
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useSignIn } from "../../auth/clerk";
import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/colors";

const ForgotPasswordScreen = () => {
  const router = useRouter();
  const { isLoaded, signIn } = useSignIn();

  const [step, setStep] = useState("email"); // email | code | new_password
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const emailLabel = useMemo(() => email.trim(), [email]);
  const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const extractMsg = (err) =>
    err?.errors?.[0]?.message || err?.errors?.[0]?.longMessage || err?.message || "";
  const looksLikeAuthLoading = (msg) => msg && msg.toLowerCase().includes("auth is still loading");

  useEffect(() => {
    if (!isLoaded || !signIn) return;
    // Clear any previous sign-in attempt state when entering this screen.
    signIn.reset().catch(() => {});
  }, [isLoaded, signIn]);

  const sendCode = async () => {
    if (!emailLabel) return Alert.alert("Error", "Please enter your email");
    if (!signIn) return Alert.alert("Error", "Auth is not ready yet. Please try again.");

    setLoading(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!isLoaded) {
          await sleep(600);
        }

        await signIn.reset();

        const { error: createError } = await signIn.create({
          identifier: emailLabel,
          strategy: "reset_password_email_code",
        });
        if (createError) {
          const msg = extractMsg(createError) || "Failed to start reset";
          if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
            await sleep(600);
            continue;
          }
          Alert.alert("Error", msg);
          console.error(JSON.stringify(createError, null, 2));
          return;
        }

        const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
        if (sendError) {
          const msg = extractMsg(sendError) || "Failed to send code";
          if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
            await sleep(600);
            continue;
          }
          Alert.alert("Error", msg);
          console.error(JSON.stringify(sendError, null, 2));
          return;
        }

        setStep("code");
        return;
      }

      Alert.alert("Error", "Auth is still loading, try again in a moment.");
    } catch (error) {
      const msg = extractMsg(error) || "Failed to send code";
      Alert.alert("Error", msg);
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async () => {
    if (!code) return Alert.alert("Error", "Please enter the code");
    if (!signIn) return Alert.alert("Error", "Auth is not ready yet. Please try again.");

    setLoading(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!isLoaded) {
          await sleep(600);
        }

        const { error: verifyError } = await signIn.resetPasswordEmailCode.verifyCode({ code });
      if (verifyError) {
          const msg = extractMsg(verifyError) || "Invalid code";
          if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
            await sleep(600);
            continue;
          }
          Alert.alert("Error", msg);
          console.error(JSON.stringify(verifyError, null, 2));
          return;
      }

      setStep("new_password");
        return;
      }

      Alert.alert("Error", "Auth is still loading, try again in a moment.");
    } catch (error) {
      const msg = extractMsg(error) || "Invalid code";
      Alert.alert("Error", msg);
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async () => {
    if (!password || !confirmPassword) return Alert.alert("Error", "Please fill in all fields");
    if (password.length < 6) return Alert.alert("Error", "Password must be at least 6 characters");
    if (password !== confirmPassword) return Alert.alert("Error", "Passwords do not match");
    if (!signIn) return Alert.alert("Error", "Auth is not ready yet. Please try again.");

    setLoading(true);
    try {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (!isLoaded) {
          await sleep(600);
        }

        const { error: submitError } = await signIn.resetPasswordEmailCode.submitPassword({
          password,
          signOutOfOtherSessions: true,
        });
        if (submitError) {
          const msg = extractMsg(submitError) || "Failed to reset password";
          if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
            await sleep(600);
            continue;
          }
          Alert.alert("Error", msg);
          console.error(JSON.stringify(submitError, null, 2));
          return;
        }

        const { error: finalizeError } = await signIn.finalize();
        if (finalizeError) {
          const msg = extractMsg(finalizeError) || "Failed to sign in";
          if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
            await sleep(600);
            continue;
          }
          Alert.alert("Error", msg);
          console.error(JSON.stringify(finalizeError, null, 2));
          return;
        }

        router.replace("/");
        return;
      }

      Alert.alert("Error", "Auth is still loading, try again in a moment.");
    } catch (error) {
      const msg = extractMsg(error) || "Failed to reset password";
      Alert.alert("Error", msg);
      console.error(JSON.stringify(error, null, 2));
    } finally {
      setLoading(false);
    }
  };

  const backToEmail = async () => {
    try {
      await signIn?.reset?.();
    } catch (_) {}
    setCode("");
    setPassword("");
    setConfirmPassword("");
    setStep("email");
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAvoidingView
        style={authStyles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <ScrollView contentContainerStyle={authStyles.scrollContent} showsVerticalScrollIndicator={false}>
          <Text style={authStyles.title}>Reset password</Text>

          {step === "email" && (
            <>
              <Text style={authStyles.subtitle}>Enter your email to receive a reset code.</Text>
              <View style={authStyles.formContainer}>
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Enter email"
                    placeholderTextColor={COLORS.textLight}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
                  onPress={sendCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={authStyles.buttonText}>{loading ? "Sending..." : "Send code"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={authStyles.linkContainer} onPress={() => router.back()} disabled={loading}>
                  <Text style={authStyles.link}>Back to Sign In</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === "code" && (
            <>
              <Text style={authStyles.subtitle}>We sent a code to the email on this account.</Text>
              <View style={authStyles.formContainer}>
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Enter code"
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
                  onPress={verifyCode}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={authStyles.buttonText}>{loading ? "Verifying..." : "Verify code"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={authStyles.linkContainer} onPress={backToEmail} disabled={loading}>
                  <Text style={authStyles.link}>Change email</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {step === "new_password" && (
            <>
              <Text style={authStyles.subtitle}>Set a new password for your account.</Text>
              <View style={authStyles.formContainer}>
                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="New password"
                    placeholderTextColor={COLORS.textLight}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <View style={authStyles.inputContainer}>
                  <TextInput
                    style={authStyles.textInput}
                    placeholder="Confirm new password"
                    placeholderTextColor={COLORS.textLight}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry
                    autoCapitalize="none"
                    editable={!loading}
                  />
                </View>

                <TouchableOpacity
                  style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
                  onPress={submitNewPassword}
                  disabled={loading}
                  activeOpacity={0.8}
                >
                  <Text style={authStyles.buttonText}>{loading ? "Saving..." : "Reset & sign in"}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={authStyles.linkContainer} onPress={() => router.back()} disabled={loading}>
                  <Text style={authStyles.link}>Back</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

export default ForgotPasswordScreen;
