import React from 'react';
import {
  Modal,
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';

interface Props {
  visible: boolean;
  onClose: () => void;
  history: {
    balance_type: 'Expense' | 'Savings';
    description: string;
    amount: number;
    created_at: string;
  }[];
}

export default function RemainingBalanceModal({
  visible,
  onClose,
  history,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Balance History</Text>

          {history.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.empty}>No history available.</Text>
            </View>
          ) : (
            <FlatList
              data={history}
              keyExtractor={(_, index) => index.toString()}
              contentContainerStyle={styles.listContent}
              renderItem={({item}) => (
                <View style={styles.card}>
                  <Text style={styles.description}>{item.description}</Text>
                  <Text
                    style={[
                      styles.amount,
                      {
                        color:
                          item.balance_type === 'Expense'
                            ? '#DC2626'
                            : '#0284C7',
                      },
                    ]}>
                    {item.balance_type === 'Expense' ? '-₱' : '-₱'}
                    {item.amount.toFixed(2)}
                  </Text>
                  <Text style={styles.date}>
                    {new Date(item.created_at).toLocaleString()}
                  </Text>
                </View>
              )}
            />
          )}

          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modal: {
    margin: 20,
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 12,
    maxHeight: '70%',
    elevation: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 15,
    marginBottom: 10,
    textAlign: 'center',
  },
  listContent: {
    paddingBottom: 6,
  },
  card: {
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderColor: '#E2E8F0',
    borderWidth: 1,
  },
  description: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  date: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  empty: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
  },
  closeBtn: {
    marginTop: 6,
    alignSelf: 'flex-end',
  },
  closeText: {
    color: '#007AFF',
    fontWeight: '600',
    fontSize: 13,
  },
});
