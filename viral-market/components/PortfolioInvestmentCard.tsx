import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/constants/data';

interface PortfolioInvestmentCardProps {
    investment: Investment;
    onPress?: () => void;
    onSellPress?: () => void;
}

export default function PortfolioInvestmentCard({
    investment,
    onPress,
    onSellPress
}: PortfolioInvestmentCardProps) {
    const isPositive = investment.performance >= 0;
    const performanceColor = isPositive ? '#4CAF50' : '#F44336';

    const viewsDelta = investment.currentViews - investment.viewsOnInvestment;
    const likesDelta = investment.currentLikes - investment.likesOnInvestment;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={onPress}
            activeOpacity={0.7}
        >
            <Image
                source={{ uri: investment.thumbnail }}
                style={styles.thumbnail}
            />

            <View style={styles.content}>
                <Text style={styles.username}>{investment.username}</Text>
                <Text style={styles.investedAt}>invested {investment.investedAt}</Text>

                <View style={styles.stats}>
                    <View style={styles.statItem}>
                        <Ionicons name="eye-outline" size={14} color="#666" />
                        <Text style={styles.statText}>{formatNumber(investment.currentViews)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="heart-outline" size={14} color="#666" />
                        <Text style={styles.statText}>{formatNumber(investment.currentLikes)}</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Text style={[styles.statText, { fontSize: 13 }]}>🪙</Text>
                        <Text style={[styles.statText, { fontWeight: '600', color: '#333' }]}>
                            {(investment.investedCoins * (1 + investment.performance / 100)).toFixed(2)}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.rightSection}>
                <View style={[styles.badge, { backgroundColor: performanceColor }]}>
                    <Text style={styles.badgeText}>
                        {isPositive ? '+' : ''}{investment.performance.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.currentStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="eye" size={14} color={viewsDelta >= 0 ? '#4CAF50' : '#F44336'} />
                        <Text style={[styles.statText, { color: viewsDelta >= 0 ? '#4CAF50' : '#F44336' }]}>
                            {viewsDelta >= 0 ? '+' : ''}{formatNumber(viewsDelta)}
                        </Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="heart" size={14} color={likesDelta >= 0 ? '#4CAF50' : '#F44336'} />
                        <Text style={[styles.statText, { color: likesDelta >= 0 ? '#4CAF50' : '#F44336' }]}>
                            {likesDelta >= 0 ? '+' : ''}{formatNumber(likesDelta)}
                        </Text>
                    </View>
                </View>

                {onSellPress && (
                    <TouchableOpacity style={styles.sellButton} onPress={(e) => {
                        e.stopPropagation(); // Prevent card tap
                        onSellPress();
                    }}>
                        <Text style={styles.sellButtonText}>Sell</Text>
                    </TouchableOpacity>
                )}
            </View>
        </TouchableOpacity>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'k';
    }
    return num.toString();
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    thumbnail: {
        width: 60,
        height: 60,
        borderRadius: 8,
        marginRight: 12,
    },
    content: {
        flex: 1,
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    investedAt: {
        fontSize: 12,
        color: '#999',
        marginBottom: 8,
    },
    stats: {
        flexDirection: 'row',
        gap: 12,
    },
    statItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: '#666',
    },
    rightSection: {
        alignItems: 'flex-end',
        gap: 8,
    },
    badge: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 16,
    },
    badgeText: {
        color: '#fff',
        fontSize: 13,
        fontWeight: '700',
    },
    currentStats: {
        gap: 4,
    },
    sellButton: {
        marginTop: 4,
        paddingHorizontal: 12,
        paddingVertical: 6,
        backgroundColor: '#FFEAEA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD1D1',
    },
    sellButtonText: {
        color: '#F44336',
        fontSize: 12,
        fontWeight: '600',
    },
});
