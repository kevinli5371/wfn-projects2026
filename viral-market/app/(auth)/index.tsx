import React, { useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import Animated, {
    useSharedValue,
    useAnimatedStyle,
    withRepeat,
    withTiming,
    withSequence,
    Easing,
} from 'react-native-reanimated';

export default function GetStartedScreen() {
    const router = useRouter();

    // Floating animation values
    const translateY = useSharedValue(0);
    const rotateZ = useSharedValue(0);
    const scale = useSharedValue(1);

    useEffect(() => {
        translateY.value = withRepeat(
            withSequence(
                withTiming(-30, { duration: 3500, easing: Easing.inOut(Easing.ease) }),
                withTiming(0, { duration: 3500, easing: Easing.inOut(Easing.ease) })
            ),
            -1, // infinite
            true // reverse
        );

        rotateZ.value = withRepeat(
            withSequence(
                withTiming(4, { duration: 5000, easing: Easing.inOut(Easing.ease) }),
                withTiming(-2, { duration: 5000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );

        scale.value = withRepeat(
            withSequence(
                withTiming(1.06, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
                withTiming(1, { duration: 4000, easing: Easing.inOut(Easing.ease) })
            ),
            -1,
            true
        );
    }, []);

    const animatedImageStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { translateY: translateY.value },
                { rotate: `${rotateZ.value}deg` },
                { scale: scale.value }
            ]
        };
    });

    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <View style={styles.container}>
                {/* Header */}
                <View style={styles.headerSection}>
                    <Text style={styles.title}>Get{'\n'}Started</Text>
                    <Text style={styles.subtitle}>Sign up or sign in</Text>
                </View>

                {/* Hero Image */}
                <View style={styles.imageContainer}>
                    <Animated.Image
                        source={require('../../assets/images/cards_animated.png')}
                        style={[styles.heroImage, animatedImageStyle]}
                        resizeMode="contain"
                    />
                </View>

                {/* Buttons */}
                <View style={styles.buttonSection}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => router.push('/(auth)/signup')}
                        activeOpacity={0.8}
                    >
                        <Text style={styles.buttonText}>Get Started</Text>
                    </TouchableOpacity>

                    <View style={styles.footerContainer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => router.push('/(auth)/login')} activeOpacity={0.6}>
                            <Text style={[styles.footerText, styles.footerLink]}>Sign in</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F9F8F6',
    },
    container: {
        flex: 1,
        justifyContent: 'space-between',
        paddingHorizontal: 32,
        paddingTop: 80,
        paddingBottom: 40,
    },
    headerSection: {
        marginTop: 20,
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
    imageContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    heroImage: {
        width: '120%',
        height: 350,
    },
    buttonSection: {
        gap: 20,
        paddingBottom: 10,
    },
    button: {
        backgroundColor: '#3E7B77',
        paddingVertical: 18,
        borderRadius: 14,
        alignItems: 'center',
    },
    buttonText: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        fontFamily: 'Futura',
    },
    footerContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
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
