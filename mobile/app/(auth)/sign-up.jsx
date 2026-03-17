import { View, Text, KeyboardAvoidingView, Platform, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native'
import { useSignUp } from "../../auth/clerk";
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { authStyles } from '../../assets/styles/auth.styles';
import { Image } from "expo-image";
import { COLORS } from '../../constants/colors';
import { Ionicons } from '@expo/vector-icons';

const SignUpScreen = () => {
    const router = useRouter();
    const { isLoaded, signUp } = useSignUp();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');


    const handleSignUp = async () => {
        const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
        const extractMsg = (err) =>
            err?.errors?.[0]?.message ||
            err?.errors?.[0]?.longMessage ||
            err?.message ||
            '';
        const looksLikeAuthLoading = (msg) =>
            msg && msg.toLowerCase().includes('auth is still loading');

        setErrorMessage('');
        if (!email || !password) { return Alert.alert('Error', 'Please fill in all fields'); }
        if (password.length < 6) { return Alert.alert('Error', 'Password must be at least 6 characters'); }
        if (!signUp) {
            const msg = 'Auth is not ready yet. Please try again.';
            setErrorMessage(msg);
            Alert.alert('Error', msg);
            return;
        }
        setLoading(true);
        try {
            let lastLoadingMsg = '';
            let created = false;

            for (let attempt = 0; attempt < 3; attempt++) {
                const { error: createError } = await signUp.create({
                    emailAddress: email.trim(),
                    password
                });

                if (createError) {
                    const msg = extractMsg(createError) || 'Sign up failed';
                    if (!isLoaded && looksLikeAuthLoading(msg) && attempt < 2) {
                        lastLoadingMsg = msg;
                        await sleep(600);
                        continue;
                    }
                    setErrorMessage(msg);
                    Alert.alert('Error', msg);
                    return;
                }

                created = true;
                break;
            }

            if (!created) {
                const msg = lastLoadingMsg || 'Auth is still loading, try again in a moment.';
                setErrorMessage(msg);
                Alert.alert('Error', msg);
                return;
            }

            const { error: sendCodeError } = await signUp.verifications.sendEmailCode();
            if (sendCodeError) {
                const msg = extractMsg(sendCodeError) || 'Failed to send verification code';
                setErrorMessage(msg);
                Alert.alert('Error', msg);
                return;
            }

            router.push({ pathname: "/verify-email", params: { email } });


        } catch (error) {
            const msg = extractMsg(error) || 'Sign up failed';
            setErrorMessage(msg);
            Alert.alert('Error', msg);
            console.error(JSON.stringify(error, null, 2));

        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={authStyles.container}>
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
                style={authStyles.keyboardView}
            >
                <ScrollView
                    contentContainerStyle={authStyles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >
                    <View>
                        <Image source={require('../../assets/images/i2.png')}
                            style={authStyles.image}
                            contentFit="contain"
                        />
                    </View>
                    <Text style={authStyles.title}>Create Account</Text>
                    <View style={authStyles.formContainer}>
                        <View style={authStyles.inputContainer}>
                            <TextInput
                                style={authStyles.textInput}
                                placeholder="Enter email"
                                placeholderTextColor={COLORS.textLight}
                                value={email}
                                onChangeText={setEmail}
                                keyboardType='email-address'
                                autoCapitalize='none'
                            />
                        </View>

                        <View style={authStyles.inputContainer}>
                            <TextInput
                                style={authStyles.textInput}
                                placeholder="Enter password"
                                placeholderTextColor={COLORS.textLight}
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry={!showPassword}
                                autoCapitalize='none'
                            />
                            <TouchableOpacity
                                style={authStyles.eyeButton}
                                onPress={() => setShowPassword(!showPassword)}
                            >
                                <Ionicons
                                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                                    size={20}
                                    color={COLORS.textLight}
                                />
                            </TouchableOpacity>
                        </View>

                        <TouchableOpacity
                            style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
                            onPress={handleSignUp}
                            disabled={loading}
                            activeOpacity={0.8}
                        >
                            {loading ? <ActivityIndicator color="#fff" /> : <Text style={authStyles.buttonText}>Sign Up</Text>}
                        </TouchableOpacity>

                        {!!errorMessage && (
                            <Text style={{ marginTop: 10, color: "#ff4d4f", textAlign: "center" }}>
                                {errorMessage}
                            </Text>
                        )}

                        <TouchableOpacity style={authStyles.switchAuth} onPress={() => router.back()}>
                            <Text style={authStyles.linkText}>
                                Already have an account?<Text style={authStyles.link}> Sign In</Text>
                            </Text>
                        </TouchableOpacity>
                    </View>


                </ScrollView>


            </KeyboardAvoidingView>

        </View>
    )
}
export default SignUpScreen;
