import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/constants/data';

interface PortfolioInvestmentCardProps {
    investment: Investment;
    onPress?: () => void;
    onSellPress?: () => void;
    onBuyPress?: () => void;
}

export default function PortfolioInvestmentCard({
    investment,
    onPress,
    onSellPress,
    onBuyPress
}: PortfolioInvestmentCardProps) {
    const isPositive = investment.performance >= 0;
    const performanceColor = isPositive ? '#61C13F' : '#CB5A44';
    
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
                
                <View style={[styles.statRow, { marginTop: 4 }]}>
                    <Text style={[styles.statText, { fontSize: 13 }]}>🪙</Text>
                    <Text style={[styles.statText, { fontWeight: '600', color: '#333' }]}>
                        {(investment.investedCoins * (1 + investment.performance / 100)).toFixed(2)}
                    </Text>
                </View>
            </View>

            <View style={styles.rightColumn}>
                <View style={[styles.badge, { backgroundColor: performanceColor }]}>
                    <Text style={styles.badgeText}>
                        {isPositive ? '+' : ''}{investment.performance.toFixed(1)}%
                    </Text>
                </View>

                <View style={styles.currentStats}>
                    <View style={styles.statRow}>
                        <Ionicons name="eye" size={12} color={viewsDelta >= 0 ? '#61C13F' : '#CB5A44'} />
                        <Text style={[styles.statText, { color: viewsDelta >= 0 ? '#61C13F' : '#CB5A44' }]}>
                            {viewsDelta >= 0 ? '+' : ''}{formatNumber(viewsDelta)}
                        </Text>
                    </View>
                    <View style={styles.statRow}>
                        <Ionicons name="heart" size={12} color={likesDelta >= 0 ? '#61C13F' : '#CB5A44'} />
                        <Text style={[styles.statText, { color: likesDelta >= 0 ? '#61C13F' : '#CB5A44' }]}>
                            {likesDelta >= 0 ? '+' : ''}{formatNumber(likesDelta)}
                        </Text>
                    </View>
                </View>

                <View style={styles.actionButtonsRow}>
                    {onBuyPress && (
                        <TouchableOpacity style={styles.buyButton} onPress={(e) => {
                            e.stopPropagation();
                            onBuyPress();
                        }}>
                            <Text style={styles.buyButtonText}>Buy</Text>
                        </TouchableOpacity>
                    )}
                    
                    {onSellPress && (
                        <TouchableOpacity style={styles.sellButton} onPress={(e) => {
                            e.stopPropagation();
                            onSellPress();
                        }}>
                            <Text style={styles.sellButtonText}>Sell</Text>
                        </TouchableOpacity>
                    )}
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
        height: 105,
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
        marginBottom: 8,
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
        height: 105,
        paddingVertical: 2,
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
    currentStats: {
        alignItems: 'flex-start',
        width: '100%',
        paddingLeft: 4,
        marginBottom: 4,
    },
    actionButtonsRow: {
        flexDirection: 'row',
        gap: 6,
        marginTop: 'auto',
    },
    buyButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#E8F5E9',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#C8E6C9',
    },
    buyButtonText: {
        color: '#4CAF50',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Futura',
    },
    sellButton: {
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#FFEAEA',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#FFD1D1',
    },
    sellButtonText: {
        color: '#F44336',
        fontSize: 12,
        fontWeight: '600',
        fontFamily: 'Futura',
    },
});
