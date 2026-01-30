import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScrapeResponse } from '@/services/api';

interface ScrapeResultCardProps {
    data: ScrapeResponse;
    onInvest: (assetId: string) => void;
    onDismiss: () => void;
    isInvesting?: boolean;
}

export default function ScrapeResultCard({
    data,
    onInvest,
    onDismiss,
    isInvesting = false
}: ScrapeResultCardProps) {
    const thumbnail = `https://picsum.photos/seed/${data.asset_id || 'preview'}/200/300`;

    return (
        <View style={styles.container}>
            <View style={styles.card}>
                <View style={styles.header}>
                    <Text style={styles.title}>Social Asset Found!</Text>
                    <TouchableOpacity onPress={onDismiss}>
                        <Ionicons name="close-circle" size={24} color="#999" />
                    </TouchableOpacity>
                </View>

                <View style={styles.content}>
                    <Image source={{ uri: thumbnail }} style={styles.thumbnail} />
                    <View style={styles.info}>
                        <Text style={styles.author}>@{data.author || 'unknown'}</Text>
                        <View style={styles.statsRow}>
                            <View style={styles.stat}>
                                <Ionicons name="eye-outline" size={14} color="#666" />
                                <Text style={styles.statText}>{formatNumber(data.views || 0)}</Text>
                            </View>
                            <View style={styles.stat}>
                                <Ionicons name="heart-outline" size={14} color="#666" />
                                <Text style={styles.statText}>{formatNumber(data.likes || 0)}</Text>
                            </View>
                        </View>
                        <Text style={styles.priceLabel}>Current Price</Text>
                        <Text style={styles.price}>${data.current_price?.toFixed(2)}</Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.investButton}
                    onPress={() => data.asset_id && onInvest(data.asset_id)}
                    disabled={isInvesting || !data.asset_id}
                >
                    {isInvesting ? (
                        <ActivityIndicator color="#fff" />
                    ) : (
                        <>
                            <Ionicons name="trending-up" size={18} color="#fff" style={{ marginRight: 8 }} />
                            <Text style={styles.investButtonText}>Invest 100 Coins</Text>
                        </>
                    )}
                </TouchableOpacity>
            </View>
        </View>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(0) + 'k';
    return num.toString();
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        padding: 16,
        borderWidth: 2,
        borderColor: '#4A9D8E',
        shadowColor: '#4A9D8E',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#4A9D8E',
    },
    content: {
        flexDirection: 'row',
        marginBottom: 16,
    },
    thumbnail: {
        width: 80,
        height: 100,
        borderRadius: 12,
        marginRight: 16,
    },
    info: {
        flex: 1,
        justifyContent: 'center',
    },
    author: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 8,
    },
    stat: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 13,
        color: '#666',
    },
    priceLabel: {
        fontSize: 11,
        color: '#999',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    price: {
        fontSize: 20,
        fontWeight: '800',
        color: '#333',
    },
    investButton: {
        backgroundColor: '#4A9D8E',
        flexDirection: 'row',
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
    },
    investButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
