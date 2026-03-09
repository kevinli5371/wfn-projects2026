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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
    const router = useRouter();
    const { signIn } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSignIn = () => {
        signIn(email, password);
    };

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
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
                            secureTextEntry
                        />
                    </View>

                    <TouchableOpacity activeOpacity={0.6} style={styles.forgotContainer}>
                        <Text style={styles.forgotText}>Forgot Password?</Text>
                    </TouchableOpacity>
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
                        <Text style={styles.linkText}>
                            Don't have an account? <Text style={styles.linkBold}>Sign up</Text>
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F3',
    },
    container: {
        flex: 1,
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
        justifyContent: 'space-between',
    },
    headerSection: {},
    title: {
        fontSize: 48,
        fontWeight: '800',
        color: '#2D2D2D',
        lineHeight: 54,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 17,
        color: '#888',
        marginTop: 8,
        fontWeight: '400',
    },
    formSection: {
        gap: 14,
    },
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#ECEAE8',
        borderRadius: 28,
        paddingHorizontal: 20,
        paddingVertical: 16,
    },
    inputIcon: {
        marginRight: 12,
    },
    input: {
        flex: 1,
        fontSize: 16,
        color: '#333',
    },
    forgotContainer: {
        alignSelf: 'flex-end',
        marginTop: 4,
    },
    forgotText: {
        fontSize: 14,
        color: '#666',
        fontWeight: '500',
    },
    bottomSection: {
        alignItems: 'center',
        gap: 16,
    },
    button: {
        backgroundColor: '#4A9D8E',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
        width: '100%',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    linkText: {
        fontSize: 14,
        color: '#888',
    },
    linkBold: {
        color: '#555',
        fontWeight: '600',
    },
});
