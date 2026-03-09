import React from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';

export default function GetStartedScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Get{'\n'}Started</Text>
                    <Text style={styles.subtitle}>Sign up or sign in</Text>
                </View>

                {/* Buttons */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/(auth)/signup')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Sign Up</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/(auth)/login')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Sign In</Text>
                    </TouchableOpacity>
                </View>
            </View>
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
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 60,
    },
    headerSection: {},
    title: {
        fontSize: 52,
        fontWeight: '800',
        color: '#2D2D2D',
        lineHeight: 58,
        letterSpacing: -1,
    },
    subtitle: {
        fontSize: 18,
        color: '#888',
        marginTop: 12,
        fontWeight: '400',
    },
    buttonSection: {
        gap: 14,
    },
    button: {
        backgroundColor: '#4A9D8E',
        paddingVertical: 16,
        borderRadius: 30,
        alignItems: 'center',
    },
    buttonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
});
