import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    Alert,
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [termsAccepted, setTermsAccepted] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const generateStrongPassword = () => {
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let newPassword = "";
        for (let i = 0, n = charset.length; i < 16; ++i) {
            newPassword += charset.charAt(Math.floor(Math.random() * n));
        }
        setPassword(newPassword);
        setConfirmPassword(newPassword);

        setShowPassword(true);
        setShowConfirmPassword(true);

        Alert.alert("Strong Password Generated", "A secure 16-character password has been filled in for you.");
    };

    const handleSignUp = () => {
        if (!termsAccepted) {
            return;
        }
        if (password !== confirmPassword) {
            Alert.alert("Error", "Passwords do not match.");
            return;
        }
        if (password.length < 6) {
            Alert.alert("Error", "Password must be at least 6 characters long.");
            return;
        }
        signUp(email, username, password);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContainer}
                    showsVerticalScrollIndicator={false}
                    bounces={false}
                >
                    <View style={styles.container}>
                        {/* Header Section */}
                        <View style={styles.topSection}>
                            <View style={styles.headerSection}>
                                <Text style={styles.title}>Sign Up</Text>
                                <Text style={styles.subtitle}>Welcome, make an account!</Text>
                            </View>

                            {/* Form Section */}
                            <View style={styles.formSection}>
                                <View style={styles.inputContainer}>
                                    <Ionicons name="mail-outline" size={20} color="#aaa" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Email"
                                        placeholderTextColor="#aaa"
                                        value={email}
                                        onChangeText={setEmail}
                                        keyboardType="email-address"
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="person-outline" size={20} color="#aaa" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Username"
                                        placeholderTextColor="#aaa"
                                        value={username}
                                        onChangeText={setUsername}
                                        autoCapitalize="none"
                                    />
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Password"
                                        placeholderTextColor="#aaa"
                                        value={password}
                                        onChangeText={setPassword}
                                        secureTextEntry={!showPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowPassword(!showPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                <View style={styles.inputContainer}>
                                    <Ionicons name="lock-closed-outline" size={20} color="#aaa" style={styles.inputIcon} />
                                    <TextInput
                                        style={styles.input}
                                        placeholder="Confirm Password"
                                        placeholderTextColor="#aaa"
                                        value={confirmPassword}
                                        onChangeText={setConfirmPassword}
                                        secureTextEntry={!showConfirmPassword}
                                    />
                                    <TouchableOpacity
                                        onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                                        style={styles.eyeIcon}
                                    >
                                        <Ionicons name={showConfirmPassword ? "eye-outline" : "eye-off-outline"} size={20} color="#999" />
                                    </TouchableOpacity>
                                </View>

                                <TouchableOpacity
                                    style={styles.suggestPasswordBtn}
                                    onPress={generateStrongPassword}
                                    activeOpacity={0.6}
                                >
                                    <Ionicons name="key-outline" size={14} color="#4A9D8E" style={{ marginRight: 4 }} />
                                    <Text style={styles.suggestPasswordText}>Suggest strong password</Text>
                                </TouchableOpacity>

                                {/* Terms and Conditions Checkbox */}
                                <TouchableOpacity
                                    style={styles.checkboxContainer}
                                    activeOpacity={0.7}
                                    onPress={() => setTermsAccepted(!termsAccepted)}
                                >
                                    <View style={[styles.checkbox, termsAccepted && styles.checkboxActive]}>
                                        {termsAccepted && <Ionicons name="checkmark" size={20} color="#fff" />}
                                    </View>
                                    <Text style={styles.checkboxText}>Do you agree to the terms and conditions?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bottom section */}
                        <View style={styles.bottomSection}>
                            <TouchableOpacity
                                style={[styles.button, !termsAccepted && styles.buttonDisabled]}
                                onPress={handleSignUp}
                                activeOpacity={0.8}
                                disabled={!termsAccepted}
                            >
                                <Text style={styles.buttonText}>Sign Up</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.replace('/(auth)/login')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>Already have an account? </Text>
                                    <Text style={[styles.footerText, styles.footerLink]}>Sign in</Text>
                                </View>
                            </TouchableOpacity>
                        </View>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9F8F6',
    },
    scrollContainer: {
        flexGrow: 1,
    },
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
        justifyContent: 'space-between',
        minHeight: '100%',
    },
    topSection: {
        flex: 1,
    },
    headerSection: {
        marginBottom: 40,
    },
    title: {
        fontSize: 54,
        fontWeight: '700',
        color: '#4A4A4A',
        letterSpacing: -0.5,
        fontFamily: 'CircularStd',
    },
    subtitle: {
        fontSize: 20,
        color: '#8E8E93',
        marginTop: 12,
        fontWeight: '500',
        fontStyle: 'italic',
    },
    formSection: {
        gap: 16,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#EBEBEB',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 18,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
        fontStyle: 'italic',
        fontWeight: '500',
    },
    eyeIcon: {
        padding: 4,
    },
    checkboxContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        paddingHorizontal: 4,
    },
    checkbox: {
        width: 24,
        height: 24,
        backgroundColor: '#C4C4C4',
        marginRight: 10,
        justifyContent: 'center',
        alignItems: 'center',
        borderRadius: 4,
    },
    checkboxActive: {
        backgroundColor: '#3E7B77',
    },
    checkboxText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    suggestPasswordBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        marginLeft: 12,
        marginTop: -6,
        paddingVertical: 4,
    },
    suggestPasswordText: {
        color: '#4A9D8E',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSection: {
        alignItems: 'center',
        gap: 20,
        paddingBottom: 10,
        marginTop: 40, // Ensure space between form and buttons when scrolling
    },
    button: {
        backgroundColor: '#3E7B77',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
        width: '100%',
    },
    buttonDisabled: {
        opacity: 0.6,
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Futura',
    },
    footerContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },
    footerText: {
        fontSize: 15,
        color: '#8E8E93',
        fontWeight: '500',
    },
    footerLink: {
        color: '#8E8E93',
        fontWeight: '600',
    },
});
