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

export default function SignUpScreen() {
    const router = useRouter();
    const { signUp } = useAuth();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const handleSignUp = () => {
        signUp(email, username, password);
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
                    <Text style={styles.title}>Sign Up</Text>
                    <Text style={styles.subtitle}>Welcome, make an account!</Text>
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
                            secureTextEntry
                        />
                    </View>
                </View>

                {/* Bottom section */}
                <View style={styles.bottomSection}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={handleSignUp}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        onPress={() => router.replace('/(auth)/login')}
                        activeOpacity={0.6}
                    >
                        <Text style={styles.linkText}>
                            Already have an account? <Text style={styles.linkBold}>Sign in</Text>
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
