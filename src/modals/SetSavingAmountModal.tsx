import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSave: (amount: number) => void;
  sourceLabel: string;
  availableAmount: number;
  loading?: boolean;
}

export default function SetSavingAmountModal({
  visible,
  onClose,
  onSave,
  sourceLabel,
  availableAmount,
  loading,
}: Props) {
  const [inputAmount, setInputAmount] = useState('');

  useEffect(() => {
    if (visible) {
      setInputAmount('');
    }
  }, [visible]);

  const handleSubmit = () => {
    const amount = parseFloat(inputAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert(
        'Invalid amount',
        'Please enter a valid number greater than 0.',
      );
      return;
    }

    if (amount > availableAmount) {
      Alert.alert(
        'Exceeded',
        `You only have ₱${availableAmount.toLocaleString()}`,
      );
      return;
    }

    onSave(amount);
    setInputAmount('');
  };

  const handleClose = () => {
    setInputAmount('');
    onClose();
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={handleClose}
      animationIn="fadeIn"
      animationOut="fadeOut"
      useNativeDriver
      style={styles.centeredModal}>
      <View style={styles.modalContainer}>
        {loading ? (
          <View style={styles.loadingWrapper}>
            <ActivityIndicator size="large" color="#4CAF50" />
          </View>
        ) : (
          <>
            <Text style={styles.modalTitle}>Add from {sourceLabel}</Text>
            <Text style={styles.availableText}>
              Available: ₱{availableAmount.toLocaleString()}
            </Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={inputAmount}
              onChangeText={setInputAmount}
              placeholder="₱0.00"
              placeholderTextColor="#aaa"
            />
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleClose}
                disabled={loading}>
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSubmit}
                disabled={loading}>
                <Text style={styles.buttonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredModal: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    width: '90%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 4,
  },
  availableText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    color: '#333',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: 'gray',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  saveButton: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  loadingWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
});
