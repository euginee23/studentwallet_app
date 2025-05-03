import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';
import Icon from 'react-native-vector-icons/Ionicons';
import AddExpenseModal from '../modals/AddExpenseModal';

type BalanceHistoryEntry = {
  description: string;
  amount: number;
  category?: string;
  created_at: string;
  balance_type: string;
};

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState<
    {description: string; amount: number; category: string; date: string}[]
  >([]);

  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const [activeAllowanceId, setActiveAllowanceId] = useState<number | null>(
    null,
  );
  const [allowance, setAllowance] = useState(0);
  const [limit, setLimit] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchExpenses = async () => {
    try {
      const user = await getUser();
      const res = await fetch(
        `${Config.API_BASE_URL}/api/balance-history/${user.user_id}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.history)) {
        const filtered = (data.history as BalanceHistoryEntry[])
          .filter(entry => entry.balance_type === 'Expense')
          .map(entry => {
            const date = new Date(entry.created_at).toLocaleDateString(
              'en-US',
              {
                month: 'short',
                day: '2-digit',
                year: 'numeric',
              },
            );
            return {
              description: entry.description,
              amount: Number(entry.amount),
              category: entry.category || 'Others',
              date,
            };
          });

        setExpenses(filtered);
      } else {
        console.error('Error fetching balance history:', data.error);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    }
  };

  const fetchAllowance = async () => {
    try {
      const user = await getUser();
      const res = await fetch(
        `${Config.API_BASE_URL}/api/allowances/${user.user_id}`,
      );
      const data = await res.json();

      if (
        res.ok &&
        Array.isArray(data.allowances) &&
        data.allowances.length > 0
      ) {
        const active = data.allowances[0];
        setAllowance(Number(active.amount));
        setLimit(Number(active.spending_limit));
        setStartDate(
          new Date(active.start_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        );
        setEndDate(
          new Date(active.end_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          }),
        );
        setActiveAllowanceId(active.allowance_id);
      }
    } catch (err) {
      console.error('Fetch allowance error:', err);
    }
  };

  useEffect(() => {
    const runFetch = async () => {
      await fetchAllowance();
      await fetchExpenses();
    };
    runFetch();
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.allowanceCard}>
        <Text style={styles.allowanceHeader}>Active Allowance</Text>
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Total:</Text>
          <Text style={styles.allowanceValue}>
            ₱{allowance.toLocaleString()}
          </Text>
        </View>
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Limit:</Text>
          <Text style={styles.allowanceValue}>₱{limit.toLocaleString()}</Text>
        </View>
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Range:</Text>
          <Text style={styles.allowanceValue}>
            {startDate} → {endDate}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Icon name="add-circle-outline" size={22} color="#4CAF50" />
        <Text style={styles.addButtonText}>Add New Expense</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.expenseList}>
        {expenses.map((item, index) => (
          <View key={index} style={styles.expenseItem}>
            <View style={{flex: 1}}>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseDateCategory}>
                  {item.date} • {item.category}
                </Text>
                <Text style={styles.expenseAmount}>
                  -₱
                  {item.amount.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </Text>
              </View>
              <Text style={styles.expenseDesc}>{item.description}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <AddExpenseModal
        visible={modalVisible}
        description={description}
        amount={amount}
        category={category}
        onChangeDescription={setDescription}
        onChangeAmount={setAmount}
        onSelectCategory={setCategory}
        onSave={fetchExpenses}
        onCancel={() => setModalVisible(false)}
        allowanceId={activeAllowanceId}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    padding: 20,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingVertical: 14,
    borderRadius: 50,
    justifyContent: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: '#4CAF50',
    fontWeight: '600',
    marginLeft: 8,
    fontSize: 15,
  },
  expenseList: {
    paddingBottom: 20,
  },
  expenseItem: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseDateCategory: {
    fontSize: 12,
    color: '#888',
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E2A38',
    marginTop: 4,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
    marginLeft: 8,
    flexShrink: 0,
  },
  allowanceInfo: {
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
  },
  allowanceText: {
    fontSize: 13,
    color: '#444',
  },
  allowanceCard: {
    backgroundColor: '#FFFDE7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#FFE082',
  },
  allowanceHeader: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FB8C00',
    marginBottom: 10,
  },
  allowanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  allowanceLabel: {
    fontSize: 13,
    color: '#555',
  },
  allowanceValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2A38',
  },
});
