import { View, Text, StyleSheet } from 'react-native';

import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { IconSymbol } from '@/components/ui/icon-symbol';

export default function PartyScreen() {
    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }}
            headerImage={
                <IconSymbol
                    size={310}
                    color="#808080"
                    name="chevron.left.forwardslash.chevron.right"
                    style={styles.headerImage}
                />
            }>
            <ThemedView style={styles.titleContainer}>
                <ThemedText type="title">Party</ThemedText>
            </ThemedView>
            <ThemedText>This is where you can create or join parties with friends.</ThemedText>

            <View style={styles.section}>
                <ThemedText type="subtitle">Leaderboard</ThemedText>
                <ThemedText>See how your friends are performing.</ThemedText>
            </View>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    headerImage: {
        color: '#808080',
        bottom: -90,
        left: -35,
        position: 'absolute',
    },
    titleContainer: {
        flexDirection: 'row',
        gap: 8,
    },
    section: {
        marginTop: 16,
        gap: 8,
    },
});
