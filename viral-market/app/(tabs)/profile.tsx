import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    Image,
    TextInput,
    Alert,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function ProfileScreen() {
    const { user, logout } = useAuth();
    
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    // Profile State
    const [displayName, setDisplayName] = useState('');
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [balance, setBalance] = useState(0);
    const [profilePictureUrl, setProfilePictureUrl] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            loadProfile();
        }
    }, [user]);

    const loadProfile = async () => {
        try {
            setIsLoading(true);
            const res = await api.getProfile(user!.userId);
            if (res.success) {
                setDisplayName(res.display_name || '');
                setUsername(res.username || '');
                setEmail(res.email || '');
                setBalance(res.balance || 0);
                setProfilePictureUrl(res.profile_picture_url || null);
            } else {
                Alert.alert('Error', res.error || 'Failed to load profile');
            }
        } catch (error) {
            console.error('Load profile error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsLoading(false);
        }
    };

    const handleSaveProfile = async () => {
        if (!displayName.trim()) {
            Alert.alert('Error', 'Display name cannot be empty');
            return;
        }

        try {
            setIsSaving(true);
            const res = await api.updateProfile(user!.userId, displayName.trim());
            if (res.success) {
                Alert.alert('Success', 'Profile updated successfully!');
            } else {
                Alert.alert('Error', res.error || 'Failed to update profile');
            }
        } catch (error) {
            console.error('Save profile error:', error);
            Alert.alert('Error', 'An unexpected error occurred');
        } finally {
            setIsSaving(false);
        }
    };

    const handlePickImage = async () => {
        // Request permissions
        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (permissionResult.granted === false) {
            Alert.alert('Permission needed', 'You need to allow camera roll access to upload an avatar.');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled && result.assets && result.assets.length > 0) {
            const selectedImage = result.assets[0];
            uploadImage(selectedImage.uri, selectedImage.mimeType || 'image/jpeg');
        }
    };

    const uploadImage = async (uri: string, mimeType: string) => {
        try {
            setIsSaving(true);
            // Optimistically update the UI
            setProfilePictureUrl(uri);
            
            const res = await api.uploadAvatar(user!.userId, uri, mimeType);
            
            if (res.success && res.profile_picture_url) {
                setProfilePictureUrl(res.profile_picture_url);
                Alert.alert('Success', 'Profile picture updated!');
            } else {
                // Revert on failure
                loadProfile();
                Alert.alert('Upload Failed', res.error || 'Could not upload image');
            }
        } catch (error) {
            console.error('Upload error:', error);
            loadProfile();
            Alert.alert('Error', 'An unexpected error occurred during upload');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#4A9D8E" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea}>
            <KeyboardAvoidingView 
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    
                    <Text style={styles.headerTitle}>Profile</Text>

                    <View style={styles.avatarSection}>
                        <TouchableOpacity onPress={handlePickImage} style={styles.avatarContainer}>
                            {profilePictureUrl ? (
                                <Image source={{ uri: profilePictureUrl }} style={styles.avatarImage} />
                            ) : (
                                <View style={styles.avatarPlaceholder}>
                                    <Ionicons name="person" size={60} color="#999" />
                                </View>
                            )}
                            <View style={styles.editBadge}>
                                <Ionicons name="camera" size={16} color="#fff" />
                            </View>
                        </TouchableOpacity>
                        <Text style={styles.usernameText}>@{username}</Text>
                    </View>

                    <View style={styles.statsSection}>
                        <View style={styles.statBox}>
                            <Text style={styles.statLabel}>Balance</Text>
                            <Text style={styles.statValue}>
                                🪙 {balance.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.formSection}>
                        <Text style={styles.inputLabel}>Display Name</Text>
                        <TextInput
                            style={styles.input}
                            value={displayName}
                            onChangeText={setDisplayName}
                            placeholder="Enter display name"
                            placeholderTextColor="#999"
                        />

                        <Text style={styles.inputLabel}>Email</Text>
                        <TextInput
                            style={[styles.input, styles.disabledInput]}
                            value={email}
                            editable={false}
                            placeholderTextColor="#999"
                        />

                        <TouchableOpacity 
                            style={[styles.saveButton, isSaving && styles.saveButtonDisabled]} 
                            onPress={handleSaveProfile}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveButtonText}>Save Changes</Text>
                            )}
                        </TouchableOpacity>
                    </View>

                    <View style={styles.logoutSection}>
                        <TouchableOpacity style={styles.logoutButton} onPress={logout}>
                            <Ionicons name="log-out-outline" size={20} color="#E74C3C" />
                            <Text style={styles.logoutText}>Log Out</Text>
                        </TouchableOpacity>
                    </View>

                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: '#F5F5F5',
    },
    container: {
        flex: 1,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5F5F5',
    },
    scrollContent: {
        padding: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 32,
    },
    avatarSection: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 12,
    },
    avatarImage: {
        width: 120,
        height: 120,
        borderRadius: 60,
    },
    avatarPlaceholder: {
        width: 120,
        height: 120,
        borderRadius: 60,
        backgroundColor: '#E5E5E5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    editBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#4A9D8E',
        width: 36,
        height: 36,
        borderRadius: 18,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#F5F5F5',
    },
    usernameText: {
        fontSize: 18,
        color: '#666',
        fontWeight: '500',
    },
    statsSection: {
        marginBottom: 32,
    },
    statBox: {
        backgroundColor: '#fff',
        padding: 20,
        borderRadius: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    statLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 8,
    },
    statValue: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A9D8E',
    },
    formSection: {
        backgroundColor: '#fff',
        padding: 24,
        borderRadius: 20,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        elevation: 2,
        marginBottom: 32,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    input: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        color: '#333',
        marginBottom: 20,
    },
    disabledInput: {
        color: '#999',
        backgroundColor: '#EAEAEA',
    },
    saveButton: {
        backgroundColor: '#4A9D8E',
        borderRadius: 12,
        paddingVertical: 16,
        alignItems: 'center',
        marginTop: 8,
    },
    saveButtonDisabled: {
        opacity: 0.7,
    },
    saveButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
    logoutSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    logoutButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFEAEA',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 24,
        gap: 8,
    },
    logoutText: {
        color: '#E74C3C',
        fontSize: 16,
        fontWeight: '600',
    },
});
