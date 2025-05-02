import React from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';

interface Props {
  visible: boolean;
  goalName: string;
  targetAmount: string;
  onChangeGoalName: (text: string) => void;
  onChangeTargetAmount: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddGoalModal({
  visible,
  goalName,
  targetAmount,
  onChangeGoalName,
  onChangeTargetAmount,
  onSave,
  onCancel,
}: Props) {
  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add New Goal</Text>

        <TextInput
          style={styles.input}
          placeholder="Goal Name"
          value={goalName}
          onChangeText={onChangeGoalName}
        />

        <TextInput
          style={styles.input}
          placeholder="Target Amount (₱)"
          keyboardType="numeric"
          value={targetAmount}
          onChangeText={onChangeTargetAmount}
        />

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
            onPress={onSave}
          >
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#ccc' }]}
            onPress={onCancel}
          >
            <Text style={[styles.modalButtonText, { color: '#333' }]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    marginBottom: 15,
  },
  modalActions: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
});
