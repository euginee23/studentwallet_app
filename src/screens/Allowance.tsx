import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';

export default function AllowanceScreen() {
  const [allowance, setAllowance] = useState(5000);
  const expenses = 2500;
  const [modalVisible, setModalVisible] = useState(false);
  const [newAllowance, setNewAllowance] = useState('');

  const remainingBalance = allowance - expenses;

  const transactions = [
    {
      date: 'Apr 25, 2025',
      data: [
        {time: '8:15 AM', description: 'Cafeteria Lunch', amount: -120},
        {time: '3:45 PM', description: 'Photocopy Notes', amount: -25},
      ],
    },
    {
      date: 'Apr 24, 2025',
      data: [
        {time: '10:00 AM', description: 'School Supplies', amount: -340},
        {time: '5:30 PM', description: 'Transportation Fare', amount: -50},
      ],
    },
    {
      date: 'Apr 23, 2025',
      data: [
        {time: '12:00 PM', description: 'Library Printing', amount: -15},
        {time: '4:20 PM', description: 'Snacks (Canteen)', amount: -80},
      ],
    },
    {
      date: 'Apr 22, 2025',
      data: [
        {time: '9:30 AM', description: 'Project Materials', amount: -500},
        {time: '1:00 PM', description: 'Allowance Received', amount: +1000},
      ],
    },
  ];

  const handleSaveAllowance = () => {
    if (newAllowance.trim() !== '' && !isNaN(Number(newAllowance))) {
      setAllowance(Number(newAllowance));
      setModalVisible(false);
      setNewAllowance('');
    }
  };

  return (
    <View style={styles.container}>
      {/* Allowance Overview */}
      <View style={styles.allowanceCard}>
        <View style={styles.rowBetween}>
          <View>
            <Text style={styles.label}>Total Allowance</Text>
            <Text style={styles.amount}>
              ₱
              {allowance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
          <View>
            <Text style={styles.label}>Remaining Balance</Text>
            <Text style={[styles.amount, {color: '#4CAF50'}]}>
              ₱
              {remainingBalance.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.setAllowanceButton}
          onPress={() => setModalVisible(true)}>
          <Icon name="add-circle-outline" size={20} color="#4CAF50" />
          <Text style={styles.setAllowanceText}>Set New Allowance</Text>
        </TouchableOpacity>
      </View>

      {/* Separation Line */}
      <View style={styles.separator} />

      {/* Scrollable Balance History */}
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.historyTitle}>Balance History</Text>
        {transactions.map((group, index) => (
          <View key={index}>
            <Text style={styles.historyDate}>{group.date}</Text>
            {group.data.map((item, idx) => (
              <View key={idx} style={styles.transactionRow}>
                <View style={styles.transactionInfo}>
                  <Text style={styles.transactionTime}>{item.time}</Text>
                  <Text style={styles.transactionDesc}>{item.description}</Text>
                </View>
                <Text
                  style={[
                    styles.transactionAmount,
                    {color: item.amount < 0 ? '#E53935' : '#4CAF50'},
                  ]}>
                  {item.amount < 0 ? '-' : '+'}₱
                  {Math.abs(item.amount).toFixed(2)}
                </Text>
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      <Modal
        isVisible={modalVisible}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        onBackdropPress={() => setModalVisible(false)}
        onBackButtonPress={() => setModalVisible(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Enter New Allowance</Text>
          <TextInput
            style={styles.input}
            placeholder="₱ Amount"
            keyboardType="numeric"
            value={newAllowance}
            onChangeText={setNewAllowance}
          />
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#4CAF50'}]}
              onPress={handleSaveAllowance}>
              <Text style={styles.modalButtonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#ccc'}]}
              onPress={() => setModalVisible(false)}>
              <Text style={[styles.modalButtonText, {color: '#333'}]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
  },
  scrollContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  allowanceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    margin: 20,
    marginBottom: 0,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 4,
  },
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginTop: 10,
    marginBottom: 10,
    marginHorizontal: 20,
  },
  label: {
    fontSize: 14,
    color: '#888',
    marginBottom: 4,
  },
  amount: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#1E2A38',
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  setAllowanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 12,
    borderRadius: 50,
    marginTop: 10,
  },
  setAllowanceText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 14,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    color: '#1E2A38',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2A38',
    marginVertical: 8,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTime: {
    fontSize: 12,
    color: '#888',
  },
  transactionDesc: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1E2A38',
  },
  transactionAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
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
    fontSize: 16,
    marginBottom: 20,
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
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
