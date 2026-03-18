import React, { useState } from 'react';
import {
    Modal,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    TextInput,
    KeyboardAvoidingView,
    Platform,
    ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Investment } from '@/constants/data';

interface SellModalProps {
    visible: boolean;
    investment: Investment | null;
    isLoading: boolean;
    onClose: () => void;
    onConfirmSell: (dollarAmount: number) => void;
}

export default function SellModal({ visible, investment, isLoading, onClose, onConfirmSell }: SellModalProps) {
    const [sellAmount, setSellAmount] = useState<string>('');
    const [error, setError] = useState<string>('');

    if (!investment) return null;

    const handleConfirm = () => {
        const amount = parseFloat(sellAmount);
        
        if (isNaN(amount) || amount <= 0) {
            setError('Please enter a valid amount greater than 0');
            return;
        }

        if (amount > investment.currentValue) {
            setError(`You only have $${investment.currentValue.toFixed(2)} to sell`);
            return;
        }

        setError('');
        onConfirmSell(amount);
    };

    const handleMax = () => {
        setSellAmount(investment.currentValue.toFixed(2));
        setError('');
    };

    const handleClose = () => {
        setSellAmount('');
        setError('');
        onClose();
    };

    const parsedAmount = parseFloat(sellAmount) || 0;
    const remainingValue = Math.max(0, investment.currentValue - parsedAmount);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent={true}
            onRequestClose={handleClose}
        >
            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <View style={styles.header}>
                        <Text style={styles.title}>Sell Investment</Text>
                        <TouchableOpacity onPress={handleClose} disabled={isLoading}>
                            <Ionicons name="close" size={24} color="#666" />
                        </TouchableOpacity>
                    </View>

                    <Text style={styles.subtitle}>
                        Investing in: <Text style={styles.username}>{investment.username}</Text>
                    </Text>

                    <View style={styles.valueCard}>
                        <Text style={styles.valueLabel}>Current Value</Text>
                        <Text style={styles.valueAmount}>${investment.currentValue.toFixed(2)}</Text>
                    </View>

                    <View style={styles.inputContainer}>
                        <Text style={styles.inputLabel}>Amount to Sell ($)</Text>
                        <View style={styles.inputWrapper}>
                            <Text style={styles.currencySymbol}>$</Text>
                            <TextInput
                                style={styles.input}
                                keyboardType="numeric"
                                value={sellAmount}
                                onChangeText={(text) => {
                                    setSellAmount(text);
                                    setError('');
                                }}
                                placeholder="0.00"
                                placeholderTextColor="#999"
                                editable={!isLoading}
                            />
                            <TouchableOpacity style={styles.maxButton} onPress={handleMax} disabled={isLoading}>
                                <Text style={styles.maxButtonText}>MAX</Text>
                            </TouchableOpacity>
                        </View>
                        {error ? <Text style={styles.errorText}>{error}</Text> : null}
                    </View>

                    <View style={styles.summaryContainer}>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Selling</Text>
                            <Text style={styles.summaryValue}>${parsedAmount.toFixed(2)}</Text>
                        </View>
                        <View style={styles.summaryRow}>
                            <Text style={styles.summaryLabel}>Remaining Value</Text>
                            <Text style={styles.summaryValue}>${remainingValue.toFixed(2)}</Text>
                        </View>
                    </View>

                    <TouchableOpacity 
                        style={[styles.confirmButton, (isLoading || !sellAmount || parseFloat(sellAmount) <= 0) && styles.confirmButtonDisabled]} 
                        onPress={handleConfirm}
                        disabled={isLoading || !sellAmount || parseFloat(sellAmount) <= 0}
                    >
                        {isLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <Text style={styles.confirmButtonText}>Confirm Sell</Text>
                        )}
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#fff',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#333',
    },
    subtitle: {
        fontSize: 14,
        color: '#666',
        marginBottom: 20,
    },
    username: {
        fontWeight: 'bold',
        color: '#333',
    },
    valueCard: {
        backgroundColor: '#F5F5F5',
        borderRadius: 12,
        padding: 16,
        marginBottom: 20,
        alignItems: 'center',
    },
    valueLabel: {
        fontSize: 14,
        color: '#666',
        marginBottom: 4,
    },
    valueAmount: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#4A9D8E',
    },
    inputContainer: {
        marginBottom: 20,
    },
    inputLabel: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
        marginBottom: 8,
    },
    inputWrapper: {
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#E0E0E0',
        borderRadius: 12,
        paddingHorizontal: 16,
        height: 56,
        backgroundColor: '#FAFAFA',
    },
    currencySymbol: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#333',
        marginRight: 8,
    },
    input: {
        flex: 1,
        fontSize: 18,
        color: '#333',
        height: '100%',
    },
    maxButton: {
        backgroundColor: '#E8F5F2',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    maxButtonText: {
        color: '#4A9D8E',
        fontSize: 12,
        fontWeight: 'bold',
    },
    errorText: {
        color: '#F44336',
        fontSize: 12,
        marginTop: 6,
    },
    summaryContainer: {
        backgroundColor: '#FAFAFA',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        gap: 12,
    },
    summaryRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    summaryLabel: {
        fontSize: 14,
        color: '#666',
    },
    summaryValue: {
        fontSize: 14,
        fontWeight: '600',
        color: '#333',
    },
    confirmButton: {
        backgroundColor: '#4A9D8E',
        borderRadius: 12,
        height: 56,
        justifyContent: 'center',
        alignItems: 'center',
    },
    confirmButtonDisabled: {
        backgroundColor: '#A5CFCA',
    },
    confirmButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});
