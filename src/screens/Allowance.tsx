import React, {useState, useEffect, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';
import Icon from 'react-native-vector-icons/Ionicons';
import SetAllowanceModal from '../modals/SetAllowanceModal';
import AddAllowanceModal from '../modals/AddAllowance';

export default function AllowanceScreen() {
  const [loading, setLoading] = useState(true);
  const [allowance, setAllowance] = useState(0);
  const [limit, setLimit] = useState(0);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [newAllowance, setNewAllowance] = useState('');
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [newLimit, setNewLimit] = useState('');
  const [newRange, setNewRange] = useState('');
  const [activeAllowanceId, setActiveAllowanceId] = useState<number | null>(
    null,
  );
  const [addLoading, setAddLoading] = useState(false);
  const [allowanceHistory, setAllowanceHistory] = useState<any[]>([]);

  const [activeTab, setActiveTab] = useState<'balance' | 'allowance'>(
    'balance',
  );
  const [viewingHistory, setViewingHistory] = useState<boolean>(false);

  const [transactions, setTransactions] = useState<
    {
      date: string;
      data: {
        time: string;
        description: string;
        amount: number;
        type: string;
      }[];
    }[]
  >([]);

  const totalExpenses = transactions
    .flatMap(group => group.data)
    .filter(item => item.type === 'Expense')
    .reduce((sum, item) => sum + item.amount, 0);
  const allowanceSavings = transactions
    .flatMap(group => group.data)
    .filter(item => item.type === 'Allowance Savings')
    .reduce((sum, item) => sum + item.amount, 0);

  const allocationSavings = transactions
    .flatMap(group => group.data)
    .filter(item => item.type === 'Allocation Savings')
    .reduce((sum, item) => sum + item.amount, 0);

  const remainingBalance = allowance - totalExpenses - allowanceSavings;

  const isOverLimit = totalExpenses > limit;
  const excess = isOverLimit ? totalExpenses - limit : 0;
  const remainingAllocation = Math.max(
    allowance - limit - allocationSavings - excess,
    0,
  );

  const fetchAllowance = useCallback(async () => {
    try {
      const user = await getUser();
      if (!user?.user_id) {
        return;
      }

      const response = await fetch(
        `${Config.API_BASE_URL}/api/allowances/${user.user_id}`,
      );
      const data = await response.json();

      if (response.ok && Array.isArray(data.allowances)) {
        if (data.allowances.length > 0) {
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
        } else {
          setAllowance(0);
          setLimit(0);
          setStartDate('');
          setEndDate('');
          setActiveAllowanceId(null);
          setTransactions([]);
          setViewingHistory(false);
          setActiveTab('balance');
        }
      }
    } catch (err) {
      console.error('Failed to fetch allowance:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBalanceHistory = useCallback(async () => {
    try {
      if (!activeAllowanceId) {
        setTransactions([]);
        return;
      }

      const user = await getUser();
      const response = await fetch(
        `${Config.API_BASE_URL}/api/balance-history/${user.user_id}?allowance_id=${activeAllowanceId}`,
      );
      const data = await response.json();

      if (response.ok && Array.isArray(data.history)) {
        const grouped = groupByDate(data.history);
        setTransactions(grouped);
      } else {
        console.error('Error fetching balance history:', data.error);
        setTransactions([]);
      }
    } catch (err) {
      console.error('Balance history fetch error:', err);
      setTransactions([]);
    }
  }, [activeAllowanceId]);

  const groupByDate = (
    entries: {
      created_at: string;
      description: string;
      amount: number;
      balance_type: string;
    }[],
  ): {
    date: string;
    data: {time: string; description: string; amount: number; type: string}[];
  }[] => {
    const map: {
      [date: string]: {
        time: string;
        description: string;
        amount: number;
        type: string;
      }[];
    } = {};

    entries.forEach(entry => {
      const dateObj = new Date(entry.created_at);
      const date = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
      const time = dateObj.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      });

      if (!map[date]) {
        map[date] = [];
      }

      map[date].push({
        time,
        description: entry.description,
        amount: Number(entry.amount),
        type: entry.balance_type,
      });
    });

    return Object.entries(map).map(([date, data]) => ({date, data}));
  };

  const fetchAllowanceHistory = useCallback(async () => {
    const user = await getUser();
    if (!user?.user_id) {
      return;
    }

    try {
      const response = await fetch(
        `${Config.API_BASE_URL}/api/allowances-history/${user.user_id}`,
      );
      const data = await response.json();

      if (response.ok) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const history = data.history.filter((item: any) => {
          const start = new Date(item.start_date);
          const end = new Date(item.end_date);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);

          return today < start || today > end;
        });

        setAllowanceHistory(history);
      }
    } catch (err) {
      console.error('Fetch allowance history error:', err);
    }
  }, []);

  useEffect(() => {
    if (!modalVisible && !viewingHistory) {
      const runSequentialFetch = async () => {
        setLoading(true);
        await fetchAllowance();
        await fetchBalanceHistory();
        await fetchAllowanceHistory();
        setLoading(false);
      };
      runSequentialFetch();
    }
  }, [
    modalVisible,
    viewingHistory,
    fetchAllowance,
    fetchBalanceHistory,
    fetchAllowanceHistory,
  ]);

  const handleSaveAllowance = async () => {
    setModalVisible(false);
    setNewAllowance('');
    setNewLimit('');
    setNewRange('');
    setLoading(true);
    await fetchAllowance();
  };

  const handleViewAllowanceHistory = async (item: any) => {
    setLoading(true);
    setViewingHistory(true);
    setActiveAllowanceId(item.allowance_id);
    setAllowance(Number(item.amount));
    setLimit(Number(item.spending_limit));

    setStartDate(
      new Date(item.start_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    );
    setEndDate(
      new Date(item.end_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    );

    try {
      const user = await getUser();
      const response = await fetch(
        `${Config.API_BASE_URL}/api/balance-history/${user.user_id}?allowance_id=${item.allowance_id}`,
      );
      const data = await response.json();

      if (response.ok && Array.isArray(data.history)) {
        const grouped = groupByDate(data.history);
        setTransactions(grouped);
      } else {
        setTransactions([]);
        console.error('Error fetching past balance history:', data.error);
      }
    } catch (err) {
      console.error('Error fetching past balance history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseHistoryView = async () => {
    setActiveAllowanceId(null);
    setViewingHistory(false);
    setTransactions([]);
    setLoading(true);
    await fetchAllowance();
    await fetchAllowanceHistory();
    setLoading(false);
  };

  const handleAddToAllowance = async () => {
    if (
      !activeAllowanceId ||
      isNaN(Number(addAmount)) ||
      Number(addAmount) <= 0
    ) {
      Alert.alert('Please enter a valid amount.');
      return;
    }

    setAddLoading(true);

    try {
      const addedAmount = Number(addAmount);
      const limitRatio = allowance > 0 ? limit / allowance : 0;
      const updatedAllowance = allowance + addedAmount;
      const updatedLimit = Math.round(updatedAllowance * limitRatio);

      await fetch(
        `${Config.API_BASE_URL}/api/allowances/${activeAllowanceId}/add`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: addedAmount,
            new_limit: updatedLimit,
          }),
        },
      );

      await fetchAllowance();
      await fetchBalanceHistory();
      setAddModalVisible(false);
      setAddAmount('');
    } catch (err) {
      console.error('Failed to add to allowance:', err);
      Alert.alert('Something went wrong while adding allowance.');
    } finally {
      setAddLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#4CAF50" />
        <Text style={styles.loadingText}>Loading allowance...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.allowanceCard}>
        <View style={styles.rowTriple}>
          <View style={[styles.amountBox, {backgroundColor: '#E8F5E9'}]}>
            <Text style={styles.label}>Allowance</Text>
            <Text style={styles.amount}>
              ₱{Number(allowance).toLocaleString()}
            </Text>
          </View>

          <View style={[styles.amountBox, {backgroundColor: '#FFF3E0'}]}>
            <Text style={styles.label}>Limit Left</Text>
            <Text style={[styles.amount, {color: '#FB8C00'}]}>
              ₱{Math.max(limit - totalExpenses, 0).toLocaleString()}
            </Text>
          </View>

          <View style={[styles.amountBox, {backgroundColor: '#E3F2FD'}]}>
            <Text style={styles.label}>Balance</Text>
            <Text style={[styles.amount, {color: '#4CAF50'}]}>
              ₱{Number(remainingBalance).toLocaleString()}
            </Text>
          </View>
        </View>

        {startDate && endDate && (
          <View style={styles.limitRangeContainer}>
            <View style={styles.limitRangeTextContainer}>
              <Text style={styles.limitRangeText}>
                {viewingHistory
                  ? 'Previous Limit for'
                  : 'Your Active Limit for'}{' '}
                {startDate} to {endDate}
              </Text>
            </View>
            <View style={styles.separatorVertical} />
            <View style={styles.limitAmountContainer}>
              <Text style={styles.limitAmount}>
                ₱{Number(limit).toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {allowance > 0 && limit > 0 && allowance - limit > 0 && (
          <View style={styles.bufferCardCompact}>
            <Text style={styles.bufferLabel}>
              Allocation | Usable Savings Goal:
            </Text>
            <Text style={styles.bufferValue}>
              ₱
              {(allowance - limit).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
            <Text style={styles.bufferLeft}>
              Left: ₱
              {remainingAllocation.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        )}

        {limit > 0 && (
          <View
            style={[
              styles.limitStatusBox,
              {backgroundColor: isOverLimit ? '#FFEBEE' : '#E8F5E9'},
            ]}>
            <Text
              style={[
                styles.limitStatusText,
                {color: isOverLimit ? '#E53935' : '#4CAF50'},
              ]}>
              {isOverLimit
                ? `⚠️ Over your spending limit by ₱${excess.toLocaleString(
                    undefined,
                    {minimumFractionDigits: 2},
                  )}`
                : `✅ Expenses are within your ₱${limit.toLocaleString(
                    undefined,
                    {
                      minimumFractionDigits: 2,
                    },
                  )} limit`}
            </Text>
          </View>
        )}

        <View style={styles.separatorLine} />

        {viewingHistory ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addAllowanceButton}
            onPress={handleCloseHistoryView}>
            <Icon name="close-circle-outline" size={18} color="red" />
            <Text style={[styles.addAllowanceText, {color: 'red'}]}>Close</Text>
          </TouchableOpacity>
        ) : allowance === 0 ? (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.setAllowanceButton}
            onPress={() => setModalVisible(true)}>
            <Icon name="add-circle-outline" size={18} color="white" />
            <Text style={styles.setAllowanceText}>Set Allowance</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.addAllowanceButton}
            onPress={() => setAddModalVisible(true)}>
            <Icon name="cash-outline" size={18} color="green" />
            <Text style={styles.addAllowanceText}>Add Allowance</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.tabCardContainer}>
        {!viewingHistory && (
          <View style={styles.tabRow}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 'balance' && styles.activeTab]}
              onPress={() => setActiveTab('balance')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'balance' && styles.activeTabText,
                ]}>
                Current Balance History
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.tab,
                activeTab === 'allowance' && styles.activeTab,
              ]}
              onPress={() => setActiveTab('allowance')}>
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'allowance' && styles.activeTabText,
                ]}>
                Allowance History
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <ScrollView contentContainerStyle={styles.scrollCardContent}>
          {viewingHistory ? (
            <>
              <Text style={styles.historyTitle}>
                Balance History for {startDate} to {endDate}
              </Text>
              {transactions.length === 0 ? (
                <Text style={styles.emptyText}>No balance history found.</Text>
              ) : (
                transactions.map((group, index) => (
                  <View key={index}>
                    <Text style={styles.historyDate}>{group.date}</Text>
                    {group.data.map((item, idx) => (
                      <View key={idx} style={styles.transactionRow}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionTime}>
                            {item.time}
                          </Text>
                          <Text style={styles.transactionDesc}>
                            {item.description}
                          </Text>
                        </View>
                        <Text
                          style={[
                            styles.transactionAmount,
                            {
                              color:
                                item.type === 'Expense'
                                  ? '#E53935'
                                  : item.type === 'Allowance Savings' ||
                                    item.type === 'Allocation Savings'
                                  ? '#FB8C00'
                                  : '#4CAF50',
                            },
                          ]}>
                          {item.type === 'Expense' ||
                          item.type.includes('Savings')
                            ? '-'
                            : '+'}
                          ₱{item.amount.toFixed(2)}
                        </Text>
                      </View>
                    ))}
                  </View>
                ))
              )}
            </>
          ) : (
            <>
              {activeTab === 'balance' ? (
                transactions.length === 0 ? (
                  <Text style={styles.emptyText}>
                    No balance history available.
                  </Text>
                ) : (
                  transactions.map((group, index) => (
                    <View key={index}>
                      <Text style={styles.historyDate}>{group.date}</Text>
                      {group.data.map((item, idx) => (
                        <View key={idx} style={styles.transactionRow}>
                          <View style={styles.transactionInfo}>
                            <Text style={styles.transactionTime}>
                              {item.time}
                            </Text>
                            <Text style={styles.transactionDesc}>
                              {item.description}
                            </Text>
                          </View>
                          <Text
                            style={[
                              styles.transactionAmount,
                              {
                                color:
                                  item.type === 'Expense'
                                    ? '#E53935'
                                    : item.type === 'Allowance Savings' ||
                                      item.type === 'Allocation Savings'
                                    ? '#FB8C00'
                                    : '#4CAF50',
                              },
                            ]}>
                            {item.type === 'Expense' ||
                            item.type === 'Allowance Savings' ||
                            item.type === 'Allocation Savings'
                              ? '-'
                              : '+'}
                            ₱{item.amount.toFixed(2)}
                          </Text>
                        </View>
                      ))}
                    </View>
                  ))
                )
              ) : allowanceHistory.length === 0 ? (
                <Text style={styles.emptyText}>
                  No allowance history to display yet.
                </Text>
              ) : (
                allowanceHistory.map((item, index) => {
                  return (
                    <View key={index} style={{marginBottom: 16}}>
                      <View style={styles.transactionRow}>
                        <View style={styles.transactionInfo}>
                          <Text style={styles.transactionDesc}>
                            Allowance: ₱{item.amount} Limit: ₱
                            {item.spending_limit}
                          </Text>
                          <Text style={styles.transactionTime}>
                            {new Date(item.start_date).toLocaleDateString(
                              'en-US',
                            )}{' '}
                            -{' '}
                            {new Date(item.end_date).toLocaleDateString(
                              'en-US',
                            )}
                          </Text>
                        </View>
                        <TouchableOpacity
                          onPress={() => handleViewAllowanceHistory(item)}
                          style={{paddingHorizontal: 10, paddingVertical: 4}}>
                          <Text style={{color: '#4CAF50', fontWeight: '600'}}>
                            View
                          </Text>
                        </TouchableOpacity>
                      </View>

                      {item.transactions?.length > 0 && (
                        <View style={{marginTop: 6, paddingLeft: 10}}>
                          {item.transactions.map(
                            (
                              tx: {
                                created_at: string;
                                description: string;
                                amount: number;
                                balance_type: string;
                              },
                              i: number,
                            ) => (
                              <View key={i} style={styles.transactionRow}>
                                <View style={styles.transactionInfo}>
                                  <Text style={styles.transactionTime}>
                                    {new Date(tx.created_at).toLocaleTimeString(
                                      'en-US',
                                      {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      },
                                    )}
                                  </Text>
                                  <Text style={styles.transactionDesc}>
                                    {tx.description}
                                  </Text>
                                </View>
                                <Text
                                  style={[
                                    styles.transactionAmount,
                                    {
                                      color:
                                        tx.balance_type === 'Expense'
                                          ? '#E53935'
                                          : tx.balance_type ===
                                              'Allowance Savings' ||
                                            tx.balance_type ===
                                              'Allocation Savings'
                                          ? '#FB8C00'
                                          : '#4CAF50',
                                    },
                                  ]}>
                                  {tx.balance_type === 'Expense' ||
                                  tx.balance_type.includes('Savings')
                                    ? '-'
                                    : '+'}
                                  ₱{Number(tx.amount).toFixed(2)}
                                </Text>
                              </View>
                            ),
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </>
          )}
        </ScrollView>
      </View>

      <SetAllowanceModal
        visible={modalVisible}
        allowance={newAllowance}
        limit={newLimit}
        range={newRange}
        onChangeAllowance={setNewAllowance}
        onChangeLimit={setNewLimit}
        onChangeRange={setNewRange}
        onSave={handleSaveAllowance}
        onCancel={() => setModalVisible(false)}
      />

      <AddAllowanceModal
        visible={addModalVisible}
        amount={addAmount}
        loading={addLoading}
        onChangeAmount={setAddAmount}
        onSave={handleAddToAllowance}
        onCancel={() => {
          setAddModalVisible(false);
          setAddAmount('');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#F7F9FB'},
  scrollContainer: {paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20},
  allowanceCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    margin: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 6,
    elevation: 2,
  },
  rowTriple: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  amountBox: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {fontSize: 12, color: '#888'},
  amount: {fontSize: 20, fontWeight: 'bold', color: '#1E2A38'},
  setAllowanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2E7D32',
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: 10,
  },
  setAllowanceText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  addAllowanceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F1F8E9',
    borderColor: '#2E7D32',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 50,
    marginTop: 8,
  },
  addAllowanceText: {
    color: '#2E7D32',
    fontWeight: '600',
    marginLeft: 6,
    fontSize: 13,
  },
  limitRangeContainer: {
    marginTop: 8,
    backgroundColor: '#FFFDE7',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  limitRangeTextContainer: {
    flex: 1,
  },
  limitRangeText: {
    fontSize: 12,
    color: '#444',
    fontWeight: '500',
  },
  separatorVertical: {
    width: 1,
    height: '100%',
    backgroundColor: '#ddd',
    marginHorizontal: 10,
  },
  limitAmountContainer: {
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  limitAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF9800',
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 8,
    color: '#1E2A38',
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1E2A38',
    marginVertical: 6,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F1F1',
  },
  transactionInfo: {flex: 1},
  transactionTime: {fontSize: 11, color: '#888'},
  transactionDesc: {fontSize: 13, fontWeight: '500', color: '#1E2A38'},
  transactionAmount: {fontSize: 13, fontWeight: '600'},
  loaderContainer: {
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
  limitStatusContainer: {
    marginTop: 8,
    alignItems: 'center',
    paddingVertical: 6,
  },
  limitStatusText: {
    fontSize: 13,
    fontWeight: '600',
  },
  bufferCardCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#E3F2FD',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 10,
  },
  bufferLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1565C0',
    flexShrink: 1,
  },
  bufferValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0D47A1',
    marginHorizontal: 8,
  },
  bufferLeft: {
    fontSize: 12,
    fontWeight: '500',
    color: '#1E2A38',
    flexShrink: 0,
  },
  limitStatusBox: {
    marginTop: 10,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separatorLine: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 10,
    marginHorizontal: 2,
  },
  tabCardContainer: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginBottom: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    overflow: 'hidden',
    flex: 1,
  },
  tabRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#F7F9FB',
  },
  activeTab: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#4CAF50',
    fontWeight: '700',
  },
  scrollCardContent: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    textAlign: 'center',
    color: '#888',
    fontSize: 13,
    marginTop: 20,
  },
});
