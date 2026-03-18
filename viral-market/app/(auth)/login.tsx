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
    ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    const handleSignIn = () => {
        signIn(email, password);
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
                        <View style={styles.topSection}>
                            {/* Header */}
                            <View style={styles.headerSection}>
                                <Text style={styles.title}>Welcome{'\n'}Back</Text>
                                <Text style={styles.subtitle}>Hey! Good to see you again!</Text>
                            </View>

                            {/* Form */}
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

                                <TouchableOpacity activeOpacity={0.6} style={styles.forgotContainer}>
                                    <Text style={styles.forgotText}>Forgot Password?</Text>
                                </TouchableOpacity>
                            </View>
                        </View>

                        {/* Bottom section */}
                        <View style={styles.bottomSection}>
                            <TouchableOpacity
                                style={styles.button}
                                onPress={handleSignIn}
                                activeOpacity={0.8}
                            >
                                <Text style={styles.buttonText}>Sign In</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => router.replace('/(auth)/signup')}
                                activeOpacity={0.6}
                            >
                                <View style={styles.footerContainer}>
                                    <Text style={styles.footerText}>Don't have an account? </Text>
                                    <Text style={[styles.footerText, styles.footerLink]}>Sign up</Text>
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
        lineHeight: 58,
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
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 4,
        marginRight: 10,
    },
    forgotText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
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
