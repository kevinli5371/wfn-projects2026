import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/constants/mockData';

interface PortfolioInvestmentCardProps {
    investment: Investment;
    onPress?: () => void;
}

export default function PortfolioInvestmentCard({
    investment,
    onPress
}: PortfolioInvestmentCardProps) {
    const isPositive = investment.performance >= 0;
    const performanceColor = isPositive ? '#61C13F' : '#CB5A44';

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

            <View style={styles.middleColumn}>
                <Text style={styles.username}>@{investment.username.replace('@', '')}</Text>
                <Text style={styles.investedAt}>Invested {investment.investedAt}</Text>

                <View style={styles.statRow}>
                    <Ionicons name="eye" size={12} color="#888" />
                    <Text style={styles.statText}>{formatNumber(investment.currentViews)}</Text>
                </View>
                <View style={styles.statRow}>
                    <Ionicons name="heart" size={12} color="#888" />
                    <Text style={styles.statText}>{formatNumber(investment.currentLikes)}</Text>
                </View>
            </View>

            <View style={styles.rightColumn}>
                <View style={[styles.badge, { backgroundColor: performanceColor }]}>
                    <Text style={styles.badgeText}>
                        {isPositive ? '+' : ''}{investment.performance.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.rightStats}>
                    <View style={styles.statRow}>
                        <Ionicons name="eye" size={12} color="#888" />
                        <Text style={styles.statText}>{formatNumber(investment.viewsOnInvestment)}</Text>
                    </View>
                    <View style={styles.statRow}>
                        <Ionicons name="heart" size={12} color="#888" />
                        <Text style={styles.statText}>{formatNumber(investment.likesOnInvestment)}</Text>
                    </View>
                </View>
            </View>
        </TouchableOpacity>
    );
}

function formatNumber(num: number): string {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(0) + 'K';
    }
    return num.toString();
}

const styles = StyleSheet.create({
    card: {
        flexDirection: 'row',
        backgroundColor: '#EBEBEB',
        borderRadius: 20,
        padding: 12,
        marginBottom: 16,
        alignItems: 'center',
    },
    thumbnail: {
        width: 70,
        height: 90,
        borderRadius: 16,
        marginRight: 16,
    },
    middleColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    username: {
        fontSize: 15,
        fontWeight: '600',
        color: '#555',
        marginBottom: 2,
        fontFamily: 'Futura',
    },
    investedAt: {
        fontSize: 11,
        color: '#888',
        fontStyle: 'italic',
        marginBottom: 10,
    },
    statRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
    },
    statText: {
        fontSize: 11,
        fontWeight: '600',
        color: '#666',
        fontFamily: 'Futura',
    },
    rightColumn: {
        alignItems: 'flex-end',
        justifyContent: 'space-between',
        height: 80,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginBottom: 8,
    },
    badgeText: {
        color: '#FFFFFF',
        fontSize: 12,
        fontWeight: 'bold',
        fontFamily: 'CircularStd',
    },
    rightStats: {
        alignItems: 'flex-start',
        width: '100%',
        paddingLeft: 4,
    },
});
