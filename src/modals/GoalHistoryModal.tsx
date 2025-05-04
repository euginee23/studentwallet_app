import React from 'react';
import {View, Text, FlatList, StyleSheet, TouchableOpacity} from 'react-native';
import Modal from 'react-native-modal';
import moment from 'moment';

interface HistoryItem {
  date: string;
  amount: number;
  source: 'Balance' | 'Allocation';
  allowanceRange: string;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  history: HistoryItem[];
}

const GoalHistoryModal: React.FC<Props> = ({visible, onClose, history}) => {
  const renderItem = ({item}: {item: HistoryItem}) => (
    <View style={styles.entry}>
      <Text style={styles.date}>
        {moment(item.date).format('MMM DD, YYYY [at] hh:mm A')}
      </Text>
      <Text style={styles.amount}>₱{item.amount.toLocaleString()}</Text>
      <Text style={styles.source}>Source: {item.source}</Text>
      <Text style={styles.range}>From: {item.allowanceRange}</Text>
    </View>
  );

  return (
    <Modal isVisible={visible} onBackdropPress={onClose}>
      <View style={styles.modalContainer}>
        <Text style={styles.title}>Savings History</Text>

        {history.length === 0 ? (
          <Text style={styles.noHistoryText}>No savings recorded yet.</Text>
        ) : (
          <FlatList
            data={history}
            keyExtractor={(_, index) => index.toString()}
            renderItem={renderItem}
            contentContainerStyle={{paddingBottom: 10}}
          />
        )}

        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <Text style={styles.closeText}>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    maxHeight: '80%',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2A38',
    marginBottom: 10,
  },
  entry: {
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingVertical: 8,
  },
  date: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
  },
  amount: {
    fontSize: 14,
    color: '#4CAF50',
    fontWeight: '700',
  },
  source: {
    fontSize: 12,
    color: '#666',
  },
  range: {
    fontSize: 12,
    color: '#888',
  },
  emptyText: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
    marginVertical: 20,
  },
  closeButton: {
    backgroundColor: '#E0F2F1',
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
    marginTop: 12,
  },
  closeText: {
    color: '#00796B',
    fontWeight: '600',
    fontSize: 14,
  },
  noHistoryText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginVertical: 10,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 6,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default GoalHistoryModal;
