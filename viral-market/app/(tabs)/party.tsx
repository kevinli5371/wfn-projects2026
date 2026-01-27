import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface PartyMember {
    id: string;
    name: string;
    videosInvested: number;
    amountInvested: number;
    performance: number;
    avatar?: string;
}

interface Party {
    name: string;
    memberCount: number;
    members: PartyMember[];
}

export default function PartyScreen() {
    const [hasParty, setHasParty] = useState(false);
    const [joinCode, setJoinCode] = useState('');
    const [partyName, setPartyName] = useState('');

    // Mock party data - in a real app, this would come from your backend
    const [party, setParty] = useState<Party>({
        name: 'fazeninjas',
        memberCount: 7,
        members: [
            {
                id: '1',
                name: 'James Yang',
                videosInvested: 9,
                amountInvested: 29900,
                performance: 450,
            },
            {
                id: '2',
                name: 'Kevin Li',
                videosInvested: 8,
                amountInvested: 23000,
                performance: -270,
            },
            {
                id: '3',
                name: 'Aaron Khaki',
                videosInvested: 10,
                amountInvested: 22745,
                performance: 670,
            },
            {
                id: '4',
                name: 'Maxwell Peng',
                videosInvested: 17,
                amountInvested: 18223,
                performance: 235,
            },
            {
                id: '5',
                name: 'Emily Liu',
                videosInvested: 4,
                amountInvested: 16080,
                performance: -983,
            },
            {
                id: '6',
                name: 'Ethan Zheng',
                videosInvested: 1,
                amountInvested: 15899,
                performance: 270,
            },
            {
                id: '7',
                name: 'Allen Liu',
                videosInvested: 9,
                amountInvested: 13079,
                performance: 450,
            },
        ],
    });

    const handleJoinParty = () => {
        if (joinCode.trim()) {
            // In a real app, validate the code with your backend
            setHasParty(true);
        }
    };

    const handleCreateParty = () => {
        if (partyName.trim()) {
            // In a real app, create the party in your backend
            setParty({ ...party, name: partyName });
            setHasParty(true);
        }
    };

    const handleLeaveParty = () => {
        setHasParty(false);
        setJoinCode('');
        setPartyName('');
    };

    const getPerformanceStyle = (performance: number) => {
        return performance >= 0 ? styles.performancePositive : styles.performanceNegative;
    };

    const formatPerformance = (performance: number) => {
        const sign = performance >= 0 ? '+' : '';
        return `${sign}${(performance / 10).toFixed(1)}%`;
    };

    // Join or Create Party Screen
    if (!hasParty) {
        return (
            <SafeAreaView style={styles.safeArea}>
                <StatusBar barStyle="dark-content" />
                <View style={styles.joinCreateContainer}>
                    <Text style={styles.mainTitle}>Join or Create a Party</Text>

                    <View style={styles.inputsContainer}>
                        <TextInput
                            style={styles.input}
                            placeholder="Enter the code of an existing party..."
                            placeholderTextColor="#C8C8C8"
                            value={joinCode}
                            onChangeText={setJoinCode}
                            autoCapitalize="none"
                        />

                        <TextInput
                            style={styles.input}
                            placeholder="Create a fun name for a new party..."
                            placeholderTextColor="#C8C8C8"
                            value={partyName}
                            onChangeText={setPartyName}
                            autoCapitalize="words"
                        />
                    </View>

                    <TouchableOpacity
                        style={styles.nextButton}
                        onPress={() => {
                            if (joinCode.trim()) {
                                handleJoinParty();
                            } else if (partyName.trim()) {
                                handleCreateParty();
                            }
                        }}
                    >
                        <Text style={styles.nextButtonText}>Next</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Leaderboard Screen
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Leave Party Button */}
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveParty}>
                    <Text style={styles.leaveButtonText}>Leave Party</Text>
                    <Ionicons name="close" size={20} color="#666" />
                </TouchableOpacity>

                {/* Party Header */}
                <View style={styles.partyHeader}>
                    <View style={styles.partyImagePlaceholder}>
                        <Ionicons name="people" size={60} color="#999" />
                    </View>
                    <Text style={styles.partyName}>{party.name}</Text>
                    <Text style={styles.memberCount}>{party.memberCount} members</Text>
                    <TouchableOpacity style={styles.inviteButton}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.inviteButtonText}>Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Rankings Section */}
                <View style={styles.rankingsSection}>
                    <Text style={styles.rankingsTitle}>Rankings</Text>

                    {party.members.map((member, index) => (
                        <View key={member.id} style={styles.memberCard}>
                            <View style={styles.memberLeft}>
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={24} color="#999" />
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{member.name}</Text>
                                    <Text style={styles.memberStats}>
                                        Invested in {member.videosInvested} videos this week
                                    </Text>
                                    <Text style={styles.memberAmount}>
                                        ${member.amountInvested.toLocaleString()}
                                    </Text>
                                </View>
                            </View>
                            <View style={[styles.performanceBadge, getPerformanceStyle(member.performance)]}>
                                <Text style={styles.performanceText}>
                                    {formatPerformance(member.performance)}
                                </Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Bottom spacing for tab bar */}
                <View style={styles.bottomSpacer} />
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    // Join/Create Screen Styles
    joinCreateContainer: {
        flex: 1,
        backgroundColor: '#F5F5F5',
        paddingHorizontal: 24,
        paddingTop: 60,
    },
    mainTitle: {
        fontSize: 56,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 40,
        lineHeight: 64,
    },
    inputsContainer: {
        gap: 16,
        marginBottom: 200,
    },
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 28,
        fontSize: 15,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    nextButton: {
        backgroundColor: '#4A9D8E',
        paddingVertical: 18,
        borderRadius: 28,
        alignItems: 'center',
        marginTop: 'auto',
        marginBottom: 40,
    },
    nextButtonText: {
        color: '#fff',
        fontSize: 17,
        fontWeight: '600',
    },
    // Leaderboard Screen Styles
    container: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-end',
        paddingHorizontal: 20,
        paddingTop: 16,
        gap: 4,
    },
    leaveButtonText: {
        fontSize: 14,
        color: '#666',
    },
    partyHeader: {
        alignItems: 'center',
        paddingVertical: 20,
    },
    partyImagePlaceholder: {
        width: 120,
        height: 120,
        backgroundColor: '#E5E5E5',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    partyName: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 4,
    },
    memberCount: {
        fontSize: 14,
        color: '#666',
        marginBottom: 12,
    },
    inviteButton: {
        flexDirection: 'row',
        backgroundColor: '#4A9D8E',
        paddingHorizontal: 20,
        paddingVertical: 8,
        borderRadius: 20,
        alignItems: 'center',
        gap: 4,
    },
    inviteButtonText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    rankingsSection: {
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    rankingsTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#4A9D8E',
        marginBottom: 16,
    },
    memberCard: {
        flexDirection: 'row',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    avatar: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberInfo: {
        flex: 1,
    },
    memberName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 2,
    },
    memberStats: {
        fontSize: 12,
        color: '#999',
        marginBottom: 2,
    },
    memberAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    performanceBadge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        marginLeft: 8,
    },
    performancePositive: {
        backgroundColor: '#7CBF3F',
    },
    performanceNegative: {
        backgroundColor: '#E74C3C',
    },
    performanceText: {
        color: '#fff',
        fontSize: 14,
        fontWeight: '600',
    },
    bottomSpacer: {
        height: 100,
    },
});
