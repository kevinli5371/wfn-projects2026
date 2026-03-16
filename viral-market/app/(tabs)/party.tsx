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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { api, GroupInfo } from '@/services/api';

export default function PartyScreen() {
    const { user } = useAuth();
    const [joinCode, setJoinCode] = useState('');
    const [partyName, setPartyName] = useState('');
    const [groups, setGroups] = useState<GroupInfo[]>([]);
    const [selectedGroup, setSelectedGroup] = useState<GroupInfo | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const userId = user?.userId ?? 'user1';

    useEffect(() => {
        loadGroups();
    }, []);

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
                {/* Back Button */}
                <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveGroup}>
                    <Text style={styles.leaveButtonText}>Back to Groups</Text>
                    <Ionicons name="chevron-forward" size={20} color="#666" />
                </TouchableOpacity>

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
                    <TouchableOpacity style={styles.inviteButton}>
                        <Ionicons name="add" size={16} color="#fff" />
                        <Text style={styles.inviteButtonText}>Invite</Text>
                    </TouchableOpacity>
                </View>

                {/* Members Section */}
                <View style={styles.rankingsSection}>
                    <Text style={styles.rankingsTitle}>Members</Text>

                    {selectedGroup.members.map((memberId, index) => (
                        <View key={memberId} style={styles.memberCard}>
                            <View style={styles.memberLeft}>
                                <View style={styles.avatar}>
                                    <Ionicons name="person" size={24} color="#999" />
                                </View>
                                <View style={styles.memberInfo}>
                                    <Text style={styles.memberName}>{memberId}</Text>
                                    {memberId === selectedGroup.created_by && (
                                        <Text style={styles.memberStats}>Creator</Text>
                                    )}
                                    {memberId === userId && (
                                        <Text style={styles.memberStats}>You</Text>
                                    )}
                                </View>
                            </View>
                        </View>
                    ))}
                </View>

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
    bottomSpacer: {
        height: 100,
    },
});
