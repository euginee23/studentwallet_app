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
    start_date: string;
    end_date: string;
    amount: number;
    description: string;
  }[];
}

export default function AllowanceHistoryModal({
  visible,
  onClose,
  history,
}: Props) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Allowance History</Text>

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
                  <Text style={styles.period}>
                    {item.description} —{' '}
                    {new Date(item.start_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}{' '}
                    -{' '}
                    {new Date(item.end_date).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                  <Text style={styles.amount}>
                    +₱{Number(item.amount).toFixed(2)}
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
    maxHeight: '60%',
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
  period: {
    fontSize: 12,
    color: '#374151',
    marginBottom: 2,
  },
  amount: {
    fontSize: 13,
    fontWeight: '600',
    color: '#16A34A',
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
