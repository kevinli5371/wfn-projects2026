import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    SafeAreaView,
    StatusBar,
    Alert,
    Modal,
    Image,
    ActivityIndicator,
    Linking
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api, GroupInfo } from '@/services/api';
import { Investment } from '@/constants/data';

export default function PartyScreen() {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [partyName, setPartyName] = useState('');
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
    const [leaderboard, setLeaderboard] = useState<any[]>([]); // Array of {username, portfolio_value, rank}
    
    // Peer Portfolio Viewing
    const [viewingMember, setViewingMember] = useState<string | null>(null);
    const [memberPortfolio, setMemberPortfolio] = useState<Investment[]>([]);
    const [isPortfolioLoading, setIsPortfolioLoading] = useState(false);

    const [isLoading, setIsLoading] = useState(false);

    const userId = user?.userId ?? 'user1';

    useEffect(() => {
        loadGroups();
    }, []);

    // Whenever selectedGroup changes, load its leaderboard
    useEffect(() => {
        if (selectedGroup) {
            loadGroupLeaderboard(selectedGroup.group_id);
        } else {
            setLeaderboard([]);
        }
    }, [selectedGroup]);

    const loadGroups = async () => {
        setIsLoading(true);
        try {
            const res = await api.getUserGroups(userId);
            if (res.success) {
                setGroups(res.groups);
                // Auto-select first group if available
                if (res.groups.length > 0 && !selectedGroup) {
                    setSelectedGroup(res.groups[0]);
                }
            }
        } finally {
            setIsLoading(false);
        }
    };

    const loadGroupLeaderboard = async (groupId: string) => {
        setIsLoading(true);
        try {
            const res = await api.getGroupLeaderboard(groupId);
            if (res && res.leaderboard) {
                setLeaderboard(res.leaderboard);
            }
        } finally {
            setIsLoading(false);
        }
    };

    const openMemberPortfolio = async (memberUserId: string, memberUsername: string) => {
        setViewingMember(memberUsername);
        setIsPortfolioLoading(true);
        try {
            // Note: In a real app we might pass user_id instead of username, 
            // but for now we'll fetch portfolio via the username that we show
            const data = await api.getPortfolio(memberUserId);
            if (data && data.investments) {
                const mappedInvestments: Investment[] = data.investments.map(item => ({
                    id: item.asset_id,
                    username: item.author || 'Unknown',
                    investedAt: 'Recently',
                    thumbnail: item.thumbnail || `https://picsum.photos/seed/${item.asset_id}/200/300`,
                    videoUrl: item.video_url,
                    viewsOnInvestment: item.views || 0,
                    likesOnInvestment: item.likes || 0,
                    currentViews: item.views || 0,
                    currentLikes: item.likes || 0,
                    performance: item.profit_loss_percent,
                    shares: item.shares || 0,
                    currentPrice: item.current_price || 0,
                    investedCoins: (item.shares || 0) * (item.buy_price || 0)
                }));
                setMemberPortfolio(mappedInvestments);
            } else {
                setMemberPortfolio([]);
            }
        } catch (e) {
            console.error("Failed to fetch member portfolio", e);
            setMemberPortfolio([]);
        } finally {
            setIsPortfolioLoading(false);
        }
    };

    const closeMemberPortfolio = () => {
        setViewingMember(null);
        setMemberPortfolio([]);
    };

    const handleJoinParty = async () => {
        if (!joinCode.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.joinGroup(userId, joinCode.trim().toUpperCase());
            if (res.success && res.group) {
                Alert.alert('Joined!', `You joined ${res.group.group_name}`);
                setJoinCode('');
                loadGroups();
                setSelectedGroup(res.group);
            } else {
                Alert.alert('Error', res.error || 'Could not join group');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateParty = async () => {
        if (!partyName.trim()) return;
        setIsLoading(true);
        try {
            const res = await api.createGroup(userId, partyName.trim());
            if (res.success && res.group) {
                Alert.alert('Created!', `Group code: ${res.group.group_id}\nShare this with friends!`);
                setPartyName('');
                loadGroups();
                setSelectedGroup(res.group);
            } else {
                Alert.alert('Error', res.error || 'Could not create group');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleLeaveGroup = () => {
        setSelectedGroup(null);
    };

    const handleQuitParty = () => {
        Alert.alert(
            "Leave Group",
            `Are you sure you want to leave ${selectedGroup?.group_name}?`,
            [
                { text: "Cancel", style: "cancel" },
                { 
                    text: "Leave", 
                    style: "destructive",
                    onPress: async () => {
                        if (!selectedGroup) return;
                        setIsLoading(true);
                        try {
                            const res = await api.leaveGroup(userId, selectedGroup.group_id);
                            if (res.success) {
                                setSelectedGroup(null);
                                loadGroups();
                            } else {
                                Alert.alert("Error", res.error || "Could not leave group");
                            }
                        } finally {
                            setIsLoading(false);
                        }
                    }
                }
            ]
        );
    };

    // If no group selected, show join/create screen
    if (!selectedGroup) {
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
                            autoCapitalize="characters"
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

                    {/* Show existing groups the user is already in */}
                    {groups.length > 0 && (
                        <View style={styles.existingGroups}>
                            <Text style={styles.existingGroupsTitle}>Your Groups</Text>
                            {groups.map((g) => (
                                <TouchableOpacity
                                    key={g.group_id}
                                    style={styles.existingGroupItem}
                                    onPress={() => setSelectedGroup(g)}
                                >
                                    <Text style={styles.existingGroupName}>{g.group_name}</Text>
                                    <Text style={styles.existingGroupCode}>Code: {g.group_id}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}

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

    // Leaderboard Screen for selected group
    return (
        <SafeAreaView style={styles.safeArea}>
            <StatusBar barStyle="dark-content" />
            <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
                {/* Top Header Row */}
                <View style={styles.topHeaderRow}>
                    <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                        <Ionicons name="chevron-back" size={20} color="#666" />
                        <Text style={styles.leaveButtonText}>Back to Groups</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.quitButtonSmall} onPress={handleQuitParty}>
                        <Ionicons name="exit-outline" size={16} color="#E74C3C" />
                        <Text style={styles.quitButtonText}>Leave</Text>
                    </TouchableOpacity>
                </View>

                {/* Party Header */}
                <View style={styles.partyHeader}>
                    <View style={styles.partyImagePlaceholder}>
                        <Ionicons name="people" size={60} color="#999" />
                    </View>
                    <Text style={styles.partyName}>{selectedGroup.group_name}</Text>
                    <Text style={styles.memberCount}>
                        {selectedGroup.members.length} member{selectedGroup.members.length !== 1 ? 's' : ''}
                    </Text>
                    <View style={styles.codeContainer}>
                        <Text style={styles.codeLabel}>Group Code:</Text>
                        <Text style={styles.codeValue}>{selectedGroup.group_id}</Text>
                    </View>
                </View>

                {/* Members Section */}
                <View style={styles.rankingsSection}>
                    <Text style={styles.rankingsTitle}>Member Rankings</Text>

                    {leaderboard.length > 0 ? (
                        leaderboard.map((member) => (
                            <TouchableOpacity 
                                key={member.user_id} 
                                style={styles.memberCard}
                                activeOpacity={0.7}
                                onPress={() => openMemberPortfolio(member.user_id, member.display_name || member.username)}
                            >
                                <View style={styles.memberLeft}>
                                    <View style={[styles.rankBadge, member.rank <= 3 ? styles[(`rankBadge${member.rank}`) as keyof typeof styles] as any : null]}>
                                        <Text style={[styles.rankText, member.rank <= 3 ? styles.topRankText : null]}>
                                            #{member.rank}
                                        </Text>
                                    </View>
                                    {member.profile_picture_url ? (
                                        <Image source={{ uri: member.profile_picture_url }} style={styles.memberAvatarImage} />
                                    ) : (
                                        <View style={styles.avatar}>
                                            <Ionicons name="person" size={24} color="#999" />
                                        </View>
                                    )}
                                    <View style={styles.memberInfo}>
                                        <Text style={styles.memberName}>{member.display_name || member.username}</Text>
                                        {member.user_id === userId && (
                                            <Text style={styles.memberStats}>You</Text>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.memberRight}>
                                    <Text style={styles.portfolioValue}>
                                        ${member.portfolio_value.toFixed(2)}
                                    </Text>
                                    <Text style={[
                                        styles.memberPL,
                                        { color: member.profit_loss_percent >= 0 ? '#4A9D8E' : '#E74C3C' }
                                    ]}>
                                        {member.profit_loss_percent >= 0 ? '+' : ''}
                                        {member.profit_loss_percent?.toFixed(2) || '0.00'}%
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        ))
                    ) : (
                        <Text style={{ textAlign: 'center', marginTop: 20, color: '#999' }}>Loading leaderboard...</Text>
                    )}
                </View>

                <View style={styles.bottomSpacer} />
            </ScrollView>

            {/* Peer Portfolio Modal */}
            <Modal
                visible={!!viewingMember}
                animationType="slide"
                transparent={true}
                onRequestClose={closeMemberPortfolio}
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{viewingMember}'s Portfolio</Text>
                            <TouchableOpacity onPress={closeMemberPortfolio}>
                                <Ionicons name="close" size={24} color="#333" />
                            </TouchableOpacity>
                        </View>

                        {isPortfolioLoading ? (
                            <ActivityIndicator size="large" color="#4A9D8E" style={{ marginTop: 40 }} />
                        ) : memberPortfolio.length === 0 ? (
                            <Text style={styles.emptyPortfolioText}>This member has no investments yet.</Text>
                        ) : (
                            <ScrollView style={styles.portfolioScroll}>
                                {memberPortfolio.map(inv => (
                                    <TouchableOpacity 
                                        key={inv.id} 
                                        style={styles.portfolioItem}
                                        activeOpacity={0.7}
                                        onPress={() => {
                                            if (inv.videoUrl) {
                                                Linking.openURL(inv.videoUrl).catch(err => {
                                                    console.error("Failed to open URL:", err);
                                                    Alert.alert("Error", "Could not open this link.");
                                                });
                                            } else {
                                                Alert.alert("Notice", "No link available for this video.");
                                            }
                                        }}
                                    >
                                        <Image source={{ uri: inv.thumbnail }} style={styles.portfolioThumb} />
                                        <View style={styles.portfolioDetails}>
                                            <Text style={styles.portfolioUsername}>{inv.username}'s Video</Text>
                                            <Text style={styles.portfolioInvested}>
                                                Invested: {inv.investedCoins.toFixed(2)} coins
                                            </Text>
                                        </View>
                                        <View style={styles.portfolioPerformance}>
                                            <Text style={[
                                                styles.perfRate,
                                                { color: inv.performance >= 0 ? '#4A9D8E' : '#E74C3C' }
                                            ]}>
                                                {inv.performance >= 0 ? '+' : ''}{inv.performance.toFixed(1)}%
                                            </Text>
                                        </View>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>
                        )}
                    </View>
                </View>
            </Modal>
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
        marginBottom: 24,
    },
    input: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 18,
        borderRadius: 28,
        fontSize: 15,
        color: '#333',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    existingGroups: {
        marginBottom: 24,
    },
    existingGroupsTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#4A9D8E',
        marginBottom: 12,
    },
    existingGroupItem: {
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingVertical: 14,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    existingGroupName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
    },
    existingGroupCode: {
        fontSize: 12,
        color: '#999',
        marginTop: 2,
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
    topHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 16,
    },
    leaveButton: {
        flexDirection: 'row',
        alignItems: 'center',
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
        marginBottom: 8,
    },
    codeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginBottom: 12,
    },
    codeLabel: {
        fontSize: 13,
        color: '#999',
    },
    codeValue: {
        fontSize: 15,
        fontWeight: '700',
        color: '#4A9D8E',
        letterSpacing: 2,
    },
    quitButtonSmall: {
        flexDirection: 'row',
        backgroundColor: '#FFEAEA',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 16,
        alignItems: 'center',
        gap: 4,
    },
    quitButtonText: {
        color: '#E74C3C',
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
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
        elevation: 2,
    },
    memberLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
    },
    rankBadge: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: '#F0F0F0',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 10,
    },
    rankBadge1: {
        backgroundColor: '#FFD700', // Gold
    },
    rankBadge2: {
        backgroundColor: '#C0C0C0', // Silver
    },
    rankBadge3: {
        backgroundColor: '#CD7F32', // Bronze
    },
    rankText: {
        fontSize: 12,
        fontWeight: '700',
        color: '#666',
    },
    topRankText: {
        color: '#fff',
    },
    avatar: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 12,
    },
    memberAvatarImage: {
        width: 44,
        height: 44,
        borderRadius: 22,
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
    memberRight: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    portfolioValue: {
        fontSize: 16,
        fontWeight: '700',
        color: '#4A9D8E',
    },
    memberPL: {
        fontSize: 13,
        fontWeight: '600',
        marginTop: 2,
    },
    bottomSpacer: {
        height: 100,
    },
    // Peer Portfolio Modal Styles
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        height: '80%',
        padding: 24,
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 22,
        fontWeight: 'bold',
        color: '#333',
    },
    emptyPortfolioText: {
        textAlign: 'center',
        marginTop: 40,
        fontSize: 16,
        color: '#999',
    },
    portfolioScroll: {
        flex: 1,
    },
    portfolioItem: {
        flexDirection: 'row',
        backgroundColor: '#F9F9F9',
        borderRadius: 12,
        padding: 12,
        marginBottom: 12,
        alignItems: 'center',
    },
    portfolioThumb: {
        width: 60,
        height: 80,
        borderRadius: 8,
        marginRight: 12,
        backgroundColor: '#E5E5E5',
    },
    portfolioDetails: {
        flex: 1,
        justifyContent: 'center',
    },
    portfolioUsername: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 4,
    },
    portfolioInvested: {
        fontSize: 13,
        color: '#666',
    },
    portfolioPerformance: {
        alignItems: 'flex-end',
        justifyContent: 'center',
    },
    perfRate: {
        fontSize: 16,
        fontWeight: 'bold',
    },
});
