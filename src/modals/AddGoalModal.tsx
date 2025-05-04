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
  goalName: string;
  targetAmount: string;
  onChangeGoalName: (text: string) => void;
  onChangeTargetAmount: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
  loading?: boolean; // <-- new prop
}

export default function AddGoalModal({
  visible,
  goalName,
  targetAmount,
  onChangeGoalName,
  onChangeTargetAmount,
  onSave,
  onCancel,
  loading = false,
}: Props) {
  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.4}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={loading ? undefined : onCancel}
      onBackButtonPress={loading ? undefined : onCancel}
      style={styles.centered}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>New Goal</Text>

        <TextInput
          style={styles.input}
          placeholder="Goal Name"
          value={goalName}
          onChangeText={onChangeGoalName}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Target Amount (₱)"
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={onChangeTargetAmount}
          editable={!loading}
        />

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, styles.save, loading && { opacity: 0.7 }]}
            onPress={onSave}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.modalButtonText}>Save</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, styles.cancel]}
            onPress={onCancel}
            disabled={loading}
          >
            <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    width: '90%',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 6,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  save: {
    backgroundColor: '#4CAF50',
  },
  cancel: {
    backgroundColor: '#ccc',
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
