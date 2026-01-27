import React, { useRef, useState } from 'react';
import {
    View,
    StyleSheet,
    Dimensions,
    TouchableOpacity,
    Text,
    Image,
    SafeAreaView,
    StatusBar,
} from 'react-native';
import { VideoView, useVideoPlayer } from 'expo-video';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/constants/mockData';

const { width, height } = Dimensions.get('window');

interface TikTokVideoPlayerProps {
    investment: Investment;
    onClose: () => void;
}

export default function TikTokVideoPlayer({ investment, onClose }: TikTokVideoPlayerProps) {
    const player = useVideoPlayer(investment.videoUrl, (player) => {
        player.loop = true;
        player.play();
    });

    const [isMuted, setIsMuted] = useState(false);

    const toggleMute = () => {
        setIsMuted(!isMuted);
    };

    return (
        <View style={styles.container}>
            <StatusBar barStyle="light-content" />

            <VideoView
                style={styles.video}
                player={player}
                allowsFullscreen
                allowsPictureInPicture
            />

            {/* Overlay Elements */}
            <SafeAreaView style={styles.overlay}>
                {/* Header with Close and Search */}
                <View style={styles.topRow}>
                    <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                        <Ionicons name="chevron-back" size={28} color="#fff" />
                    </TouchableOpacity>
                    <View style={styles.tabContainer}>
                        <Text style={styles.tabTextActive}>For You</Text>
                        <View style={styles.tabIndicator} />
                    </View>
                    <TouchableOpacity style={styles.iconButton}>
                        <Ionicons name="search" size={24} color="#fff" />
                    </TouchableOpacity>
                </View>

                {/* Right Side Actions */}
                <View style={styles.rightActions}>
                    <View style={styles.profileContainer}>
                        <Image
                            source={{ uri: investment.thumbnail }}
                            style={styles.profileImage}
                        />
                        <View style={styles.followButton}>
                            <Ionicons name="add" size={14} color="#fff" />
                        </View>
                    </View>

                    <View style={styles.actionItem}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="heart" size={36} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.actionText}>{formatNumber(investment.currentLikes)}</Text>
                    </View>

                    <View style={styles.actionItem}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="chatbubble-ellipses" size={32} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.actionText}>1.2k</Text>
                    </View>

                    <View style={styles.actionItem}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="bookmark" size={32} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.actionText}>856</Text>
                    </View>

                    <View style={styles.actionItem}>
                        <TouchableOpacity style={styles.actionButton}>
                            <Ionicons name="arrow-redo" size={32} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.actionText}>234</Text>
                    </View>

                    <View style={styles.musicDisc}>
                        <Ionicons name="disc" size={32} color="#666" />
                    </View>
                </View>

                {/* Bottom Info */}
                <View style={styles.bottomInfo}>
                    <Text style={styles.username}>{investment.username}</Text>
                    <Text style={styles.description} numberOfLines={2}>
                        Check out this amazing video! #viral #investment #crypto #shorts
                    </Text>
                    <View style={styles.musicContainer}>
                        <Ionicons name="musical-notes" size={12} color="#fff" />
                        <Text style={styles.musicText}>Original sound - {investment.username}</Text>
                    </View>
                </View>

                {/* Progress Bar */}
                <View style={styles.progressBar}>
                    <View style={[styles.progressLine, { width: '40%' }]} />
                </View>
            </SafeAreaView>
        </View>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#000',
    },
    video: {
        width: width,
        height: height,
        position: 'absolute',
    },
    overlay: {
        flex: 1,
        justifyContent: 'space-between',
    },
    topRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingTop: 10,
    },
    iconButton: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    tabContainer: {
        paddingBottom: 4,
        alignItems: 'center',
    },
    tabTextActive: {
        color: '#fff',
        fontSize: 17,
        fontWeight: 'bold',
    },
    tabIndicator: {
        width: 20,
        height: 2,
        backgroundColor: '#fff',
        marginTop: 4,
        borderRadius: 1,
    },
    rightActions: {
        position: 'absolute',
        right: 8,
        bottom: 120,
        gap: 16,
        alignItems: 'center',
    },
    profileContainer: {
        marginBottom: 8,
    },
    profileImage: {
        width: 50,
        height: 50,
        borderRadius: 25,
        borderWidth: 2,
        borderColor: '#fff',
    },
    followButton: {
        position: 'absolute',
        bottom: -8,
        alignSelf: 'center',
        width: 20,
        height: 20,
        borderRadius: 10,
        backgroundColor: '#FF2D55',
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionItem: {
        alignItems: 'center',
        gap: 4,
    },
    actionButton: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
    },
    actionText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    musicDisc: {
        marginTop: 8,
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#222',
        borderWidth: 8,
        borderColor: '#333',
        justifyContent: 'center',
        alignItems: 'center',
    },
    bottomInfo: {
        paddingHorizontal: 16,
        paddingBottom: 24,
        gap: 8,
    },
    username: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    description: {
        color: '#fff',
        fontSize: 14,
        textShadowColor: 'rgba(0, 0, 0, 0.5)',
        textShadowOffset: { width: 1, height: 1 },
        textShadowRadius: 2,
    },
    musicContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    musicText: {
        color: '#fff',
        fontSize: 14,
    },
    progressBar: {
        height: 2,
        width: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.2)',
        position: 'absolute',
        bottom: 0,
    },
    progressLine: {
        height: '100%',
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
    },
});
