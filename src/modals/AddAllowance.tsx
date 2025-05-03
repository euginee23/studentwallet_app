import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Modal from 'react-native-modal';

interface Props {
  visible: boolean;
  amount: string;
  loading: boolean;
  onChangeAmount: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddAllowanceModal({
  visible,
  amount,
  loading,
  onChangeAmount,
  onSave,
  onCancel,
}: Props) {
  return (
    <Modal
      isVisible={visible}
      onBackdropPress={!loading ? onCancel : undefined}>
      <View style={styles.modalContainer}>
        <Text style={styles.modalTitle}>Add to Allowance</Text>

        <Text style={styles.label}>Enter Amount</Text>
        <TextInput
          style={styles.input}
          keyboardType="numeric"
          value={amount}
          editable={!loading}
          onChangeText={onChangeAmount}
          placeholder="₱0.00"
        />

        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={loading}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.saveButton, loading && {opacity: 0.7}]}
            onPress={onSave}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.saveText}>Add</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
    color: '#1E2A38',
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
    color: '#1E2A38',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  cancelText: {
    color: '#888',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 6,
  },
  saveText: {
    color: 'white',
    fontWeight: '600',
  },
});
