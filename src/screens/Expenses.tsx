import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
    {
      description: string;
      amount: number;
      category: string;
      date: string;
      time: string;
    }[]
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

  const [allowances, setAllowances] = useState<any[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const [loading, setLoading] = useState(true);

  const isSelectedActive = (() => {
    const selected = allowances.find(a => a.id === activeAllowanceId);
    if (!selected) {return false;}

    const now = new Date();
    const start = new Date(selected.startDate);
    const end = new Date(selected.endDate);

    return (
      now >= new Date(start.setHours(0, 0, 0, 0)) &&
      now <= new Date(end.setHours(23, 59, 59, 999))
    );
  })();

  const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
  const hasExceededLimit = totalSpent > limit;

  const selectAllowance = (item: any) => {
    setAllowance(item.amount);
    setLimit(item.limit);
    setStartDate(
      new Date(item.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    );
    setEndDate(
      new Date(item.endDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    );
    setActiveAllowanceId(item.id);
  };

  const fetchExpenses = useCallback(async () => {
    try {
      const user = await getUser();
      if (!activeAllowanceId) {
        return;
      }

      const res = await fetch(
        `${Config.API_BASE_URL}/api/balance-history/${user.user_id}?allowance_id=${activeAllowanceId}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.history)) {
        const filtered = (data.history as BalanceHistoryEntry[])
          .filter(entry => entry.balance_type === 'Expense')
          .map(entry => {
            const dateObj = new Date(entry.created_at);
            const date = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              year: 'numeric',
            });
            const time = dateObj.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
            });
            return {
              description: entry.description,
              amount: Number(entry.amount),
              category: entry.category || 'Others',
              date,
              time,
            };
          });

        setExpenses(filtered);
      } else {
        console.error('Error fetching balance history:', data.error);
      }
    } catch (err) {
      console.error('Fetch expenses error:', err);
    }
  }, [activeAllowanceId]);

  const fetchAllowance = useCallback(async () => {
    const user = await getUser();
    if (!user?.user_id) {return;}

    try {
      const res = await fetch(
        `${Config.API_BASE_URL}/api/allowances-summary/${user.user_id}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.summaries)) {
        const parsed = data.summaries.map((item: any) => {
          const startLabel = item.start_date
            ? new Date(item.start_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'Invalid';
          const endLabel = item.end_date
            ? new Date(item.end_date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })
            : 'Invalid';

          return {
            id: item.allowance_id,
            label: `${
              item.isActive ? 'Active' : 'Allowance'
            } (${startLabel} - ${endLabel})`,
            amount: Number(item.amount),
            limit: Number(item.spending_limit),
            startDate: item.start_date,
            endDate: item.end_date,
          };
        });

        setAllowances(parsed);
        if (!activeAllowanceId && parsed.length > 0) {
          selectAllowance(
            parsed.find((a: any) => a.label.startsWith('Active')) || parsed[0],
          );
        }
      }
    } catch (err) {
      console.error('Failed to fetch allowances:', err);
    }
  }, [activeAllowanceId]);

  useEffect(() => {
    const runFetch = async () => {
      setLoading(true);
      await fetchAllowance();
      setLoading(false);
    };
    runFetch();
  }, [fetchAllowance]);

  useEffect(() => {
    if (activeAllowanceId) {
      fetchExpenses();
    }
  }, [activeAllowanceId, fetchExpenses]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading expenses...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.allowanceCard}>
        <View style={{marginBottom: 14}}>
          <TouchableOpacity
            style={styles.dropdownToggle}
            onPress={() => setDropdownOpen(!dropdownOpen)}>
            <Text style={styles.dropdownSelectedText}>
              {startDate && endDate
                ? `${startDate} - ${endDate}`
                : 'Select Allowance'}
            </Text>
            <Icon
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#444"
            />
          </TouchableOpacity>

          {dropdownOpen && (
            <View style={styles.dropdownList}>
              {allowances.map(item => {
                const now = new Date();
                const start = new Date(item.startDate);
                const end = new Date(item.endDate);
                const isActive =
                  now >= new Date(start.setHours(0, 0, 0, 0)) &&
                  now <= new Date(end.setHours(23, 59, 59, 999));

                const label = `${start.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })} - ${end.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}${isActive ? ' - (Active)' : ''}`;

                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.dropdownItem}
                    onPress={() => {
                      setAllowance(item.amount);
                      setLimit(item.limit);
                      setStartDate(
                        new Date(item.startDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                      );
                      setEndDate(
                        new Date(item.endDate).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        }),
                      );
                      setActiveAllowanceId(item.id);
                      setDropdownOpen(false);
                    }}>
                    <Text style={styles.dropdownText}>{label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>
        {isSelectedActive && (
          <Text style={styles.allowanceHeader}>Active Allowance</Text>
        )}
        {hasExceededLimit && (
          <Text style={styles.exceededWarning}>
            ⚠️ You have exceeded your limit!
          </Text>
        )}
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Total Allowance:</Text>
          <Text style={styles.allowanceValue}>
            ₱{allowance.toLocaleString()}
          </Text>
        </View>
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Limit:</Text>
          <Text style={styles.allowanceValue}>₱{limit.toLocaleString()}</Text>
        </View>
        <View style={styles.allowanceRow}>
          <Text style={styles.allowanceLabel}>Total Expenses:</Text>
          <Text style={styles.allowanceValue}>
            ₱{totalSpent.toLocaleString()}
          </Text>
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
        disabled={!activeAllowanceId}
        style={[styles.addButton, !activeAllowanceId && {opacity: 0.5}]}
        onPress={() => setModalVisible(true)}>
        <Icon name="add-circle-outline" size={22} color="#4CAF50" />
        <Text style={styles.addButtonText}>Add New Expense</Text>
      </TouchableOpacity>

      {!activeAllowanceId && (
        <Text style={styles.noAllowanceText}>
          To add expenses, please go to the Allowance tab and set your
          allowance.
        </Text>
      )}

      <ScrollView contentContainerStyle={styles.expenseList}>
        {expenses.map((item, index) => (
          <View key={index} style={styles.expenseItem}>
            <View style={{flex: 1}}>
              <View style={styles.expenseRow}>
                <Text style={styles.expenseDateCategory}>
                  {item.date}, {item.time} • {item.category}
                </Text>
                <Text style={styles.expenseAmount}>
                  - ₱
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
  noAllowanceText: {
    textAlign: 'center',
    color: '#E53935',
    fontSize: 13,
    marginBottom: 12,
    fontWeight: '500',
  },
  dropdownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  dropdownSelectedText: {
    fontSize: 13,
    color: '#1E2A38',
  },
  dropdownList: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
    marginTop: 4,
    overflow: 'hidden',
  },
  dropdownItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  dropdownText: {
    fontSize: 13,
    color: '#444',
  },
  exceededWarning: {
    color: '#D32F2F',
    fontWeight: '600',
    marginTop: 6,
    fontSize: 13,
    marginBottom: 10,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#1E2A38',
    fontWeight: '500',
  },
});
