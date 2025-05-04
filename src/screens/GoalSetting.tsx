import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AddGoalModal from '../modals/AddGoalModal';
import SetSavingAmountModal from '../modals/SetSavingAmountModal';
import GoalHistoryModal from '../modals/GoalHistoryModal';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
  createdAt?: string;
}

interface Allowance {
  id: number;
  label: string;
  balance: number;
  allocation: number;
  remainingLimit: number;
  isActive: boolean;
  spendingLimit?: number;
  overspending?: number;
}

interface HistoryItem {
  date: string;
  amount: number;
  source: 'Balance' | 'Allocation';
  allowanceRange: string;
}

export default function GoalSettingScreen() {
  const [allowances, setAllowances] = useState<Allowance[]>([]);
  const [selectedAllowanceId, setSelectedAllowanceId] = useState<number | null>(
    null,
  );
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeTransferSource, setActiveTransferSource] = useState<
    null | 'balance' | 'allocation'
  >(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');
  const [amountModalVisible, setAmountModalVisible] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<number | null>(null);
  const selectedAllowance = allowances.find(a => a.id === selectedAllowanceId);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [savingGoal, setSavingGoal] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [goalHistory, setGoalHistory] = useState<HistoryItem[]>([]);

  const [deletingGoalId, setDeletingGoalId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAllowances = useCallback(async () => {
    const user = await getUser();
    if (!user?.user_id) {
      return;
    }

    try {
      const res = await fetch(
        `${Config.API_BASE_URL}/api/allowances-summary/${user.user_id}`,
      );
      const data = await res.json();

      if (res.ok && Array.isArray(data.summaries)) {
        const parsed: Allowance[] = data.summaries.map((item: any) => {
          const startLabel = item.start_date
            ? formatDate(item.start_date)
            : 'Invalid Date';
          const endLabel = item.end_date
            ? formatDate(item.end_date)
            : 'Invalid Date';

          return {
            id: item.allowance_id,
            label: `${
              item.isActive ? 'Active' : 'Allowance'
            } (${startLabel} - ${endLabel})`,
            balance: Math.max(item.remainingBalance, 0),
            remainingLimit: Math.max(item.remainingLimit ?? 0, 0),
            allocation: Math.max(item.remainingAllocation, 0),
            isActive: item.isActive,
            spendingLimit: item.spending_limit,
            overspending: item.overspending,
          };
        });

        setAllowances(parsed);
        const active = parsed.find(a => a.isActive);
        setSelectedAllowanceId(active?.id || parsed[0]?.id || null);
      }
    } catch (err) {
      console.error('Failed to fetch allowance summaries:', err);
    }
  }, []);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {month: 'short', day: 'numeric'});
  };

  const handleGoalSelect = async (goalId: number) => {
    setSelectedGoalId(null);

    if (activeTransferSource) {
      setTimeout(() => {
        setSelectedGoalId(goalId);
        setAmountModalVisible(true);
      }, 100);
      return;
    }

    try {
      const res = await fetch(
        `${Config.API_BASE_URL}/api/goal-history/${goalId}`,
      );
      const data = await res.json();
      if (res.ok) {
        setGoalHistory(data.history);
        setHistoryModalVisible(true);
      }
    } catch (err) {
      console.error('Failed to fetch goal history:', err);
    }
  };

  const fetchGoals = useCallback(async (userId: number) => {
    try {
      const res = await fetch(`${Config.API_BASE_URL}/api/goals/${userId}`);
      const data = await res.json();
      if (res.ok && Array.isArray(data.goals)) {
        const parsed: Goal[] = data.goals.map((g: any) => ({
          id: g.goal_id,
          title: g.title,
          targetAmount: Number(g.goal_amount),
          currentAmount: Number(g.current_amount),
          createdAt: g.created_at,
        }));
        setGoals(parsed);
      }
    } catch (err) {
      console.error('Failed to fetch goals:', err);
    }
  }, []);

  const handleSaveGoal = async () => {
    if (
      newGoalTitle.trim() !== '' &&
      newGoalTarget.trim() !== '' &&
      !isNaN(Number(newGoalTarget))
    ) {
      const user = await getUser();
      if (!user?.user_id) {
        return;
      }

      setSavingGoal(true);

      try {
        const res = await fetch(`${Config.API_BASE_URL}/api/goals`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: user.user_id,
            title: newGoalTitle,
            target_amount: Number(newGoalTarget),
          }),
        });

        if (res.ok) {
          setNewGoalTitle('');
          setNewGoalTarget('');
          setModalVisible(false);
          fetchGoals(user.user_id);
        }
      } catch (err) {
        console.error('Failed to save goal:', err);
      } finally {
        setSavingGoal(false);
      }
    }
  };

  const handleDeleteGoal = (goalId: number) => {
    Alert.alert(
      'Remove Goal',
      'Are you sure you want to remove this goal?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const user = await getUser();
            if (!user?.user_id) {return;}

            setDeletingGoalId(goalId);

            try {
              const res = await fetch(
                `${Config.API_BASE_URL}/api/goals/${goalId}`,
                {
                  method: 'DELETE',
                  headers: {'Content-Type': 'application/json'},
                  body: JSON.stringify({user_id: user.user_id}),
                },
              );

              if (res.ok) {
                await fetchGoals(user.user_id);
              } else {
                Alert.alert('Error', 'Failed to delete goal.');
              }
            } catch (err) {
              console.error('Delete goal error:', err);
            } finally {
              setDeletingGoalId(null);
            }
          },
        },
      ],
      {cancelable: true},
    );
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await fetchAllowances();

      const user = await getUser();
      if (user?.user_id) {
        await fetchGoals(user.user_id);
      }
      setLoading(false);
    };

    fetchAll();
  }, [fetchAllowances, fetchGoals]);

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
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}>
          <Icon name="add-circle-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <View style={styles.dropdownSection}>
        <Text style={styles.dropdownLabel}>Select Allowance:</Text>
        <TouchableOpacity
          style={styles.dropdownToggle}
          onPress={() => setDropdownOpen(!dropdownOpen)}>
          <Text style={styles.dropdownSelectedText}>
            {selectedAllowance?.label || 'Select...'}
          </Text>
          <Icon
            name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color="#444"
          />
        </TouchableOpacity>

        {dropdownOpen && (
          <View style={styles.dropdownList}>
            {allowances.map(item => (
              <TouchableOpacity
                key={item.id}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelectedAllowanceId(item.id);
                  setDropdownOpen(false);
                }}>
                <Text style={styles.dropdownText}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <Text style={styles.budgetLabel}>Your Budget:</Text>

        {selectedAllowance?.overspending &&
        selectedAllowance.overspending > 0 ? (
          <View style={styles.overspendingBox}>
            <Text style={styles.overspendingText}>
              {`Your limit is: ₱${
                selectedAllowance.spendingLimit?.toLocaleString() ?? '0'
              } and you have overspent by ₱${
                selectedAllowance.overspending?.toLocaleString() ?? '0'
              }. Allocation has been reduced accordingly.`}
            </Text>
          </View>
        ) : null}

        <View style={styles.savingsRowBox}>
          <TouchableOpacity
            style={[
              styles.savingsButton,
              activeTransferSource === 'allocation' && {opacity: 0.5},
              (selectedAllowance?.remainingLimit ?? 0) === 0 && {opacity: 0.4},
            ]}
            disabled={
              activeTransferSource === 'allocation' ||
              (selectedAllowance?.remainingLimit ?? 0) === 0
            }
            onPress={() => {
              if (goals.length === 0) {
                Alert.alert(
                  'No Savings Goals',
                  'Please add a savings goal first.',
                );
                return;
              }
              setActiveTransferSource('balance');
            }}>
            <View>
              <Text style={styles.savingsLabel}>Remaining Limit</Text>
              <Text style={styles.savingsValue}>
                ₱{(selectedAllowance?.remainingLimit ?? 0).toLocaleString()}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.savingsButton,
              activeTransferSource === 'balance' && {opacity: 0.5},
              (selectedAllowance?.allocation ?? 0) === 0 && {opacity: 0.4},
            ]}
            disabled={
              activeTransferSource === 'balance' ||
              (selectedAllowance?.allocation ?? 0) === 0
            }
            onPress={() => {
              if (goals.length === 0) {
                Alert.alert(
                  'No Savings Goals',
                  'Please add a savings goal first.',
                );
                return;
              }
              setActiveTransferSource('allocation');
            }}>
            <View>
              <Text style={styles.savingsLabel}>Remaining Allocation</Text>
              <Text style={styles.savingsValue}>
                ₱{(selectedAllowance?.allocation ?? 0).toLocaleString()}
              </Text>
            </View>
            <Icon name="chevron-forward" size={16} color="#999" />
          </TouchableOpacity>

          {activeTransferSource && (
            <TouchableOpacity
              style={{marginLeft: 8, justifyContent: 'center'}}
              onPress={() => setActiveTransferSource(null)}>
              <Icon name="close-circle" size={20} color="#E53935" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {goals.length === 0 ? (
          <Text style={styles.noGoalsText}>
            No savings goals yet. Start by adding one!
          </Text>
        ) : (
          goals.map(goal => (
            <View
              key={goal.id}
              style={[
                styles.goalCard,
                activeTransferSource && {
                  borderWidth: 1,
                  borderColor: '#4CAF50',
                },
              ]}>
              <View style={styles.goalHeader}>
                <Text style={styles.goalTitle}>{goal.title}</Text>
                <View style={styles.goalAmountRow}>
                  <Text style={styles.goalAmount}>
                    ₱{goal.currentAmount.toLocaleString()} / ₱
                    {goal.targetAmount.toLocaleString()}
                  </Text>
                  <TouchableOpacity
                    style={styles.deleteIcon}
                    onPress={() => handleDeleteGoal(goal.id)}>
                    {deletingGoalId === goal.id ? (
                      <ActivityIndicator size="small" color="#D32F2F" />
                    ) : (
                      <Icon name="trash-outline" size={16} color="#D32F2F" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>

              <TouchableOpacity
                onPress={() => handleGoalSelect(goal.id)}
                activeOpacity={0.7}>
                <View style={styles.progressBarBackground}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${
                          (goal.currentAmount / goal.targetAmount) * 100
                        }%`,
                      },
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {savingGoal && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      )}

      <AddGoalModal
        visible={modalVisible}
        goalName={newGoalTitle}
        targetAmount={newGoalTarget}
        onChangeGoalName={setNewGoalTitle}
        onChangeTargetAmount={setNewGoalTarget}
        onSave={handleSaveGoal}
        onCancel={() => setModalVisible(false)}
        loading={savingGoal}
      />

      <SetSavingAmountModal
        visible={amountModalVisible}
        loading={savingGoal}
        sourceLabel={
          activeTransferSource === 'balance'
            ? 'Balance'
            : activeTransferSource === 'allocation'
            ? 'Allocation'
            : ''
        }
        availableAmount={
          activeTransferSource === 'balance'
            ? selectedAllowance?.balance || 0
            : selectedAllowance?.allocation || 0
        }
        onClose={() => {
          setAmountModalVisible(false);
          setSelectedGoalId(null);
        }}
        onSave={async (amount: number) => {
          if (!selectedGoalId || !selectedAllowanceId) {
            return;
          }

          const user = await getUser();
          if (!user?.user_id) {
            return;
          }

          try {
            const goalRes = await fetch(
              `${Config.API_BASE_URL}/api/goals/${selectedGoalId}/add`,
              {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  amount,
                  user_id: user.user_id,
                  allowance_id: selectedAllowanceId,
                  balance_type:
                    activeTransferSource === 'balance'
                      ? 'Allowance Savings'
                      : 'Allocation Savings',
                }),
              },
            );

            if (goalRes.ok) {
              await fetchGoals(user.user_id);
            } else {
              console.error('Failed to save goal or log to balance_history.');
            }
          } catch (err) {
            console.error('Failed to update goal and balance history:', err);
          }

          if (activeTransferSource === 'balance') {
            selectedAllowance!.balance -= amount;
          } else {
            selectedAllowance!.allocation -= amount;
          }

          setAmountModalVisible(false);
          setActiveTransferSource(null);
          setSelectedGoalId(null);
        }}
      />

      <GoalHistoryModal
        visible={historyModalVisible}
        history={goalHistory}
        onClose={() => setHistoryModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 14,
    paddingTop: 14,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2A38',
  },
  addButton: {
    backgroundColor: '#E8F5E9',
    padding: 6,
    borderRadius: 20,
  },
  dropdownSection: {
    marginBottom: 14,
  },
  dropdownLabel: {
    fontSize: 12,
    color: '#555',
    marginBottom: 4,
    fontWeight: '500',
  },
  budgetLabel: {
    fontSize: 12,
    color: '#555',
    marginTop: 6,
    fontWeight: '500',
  },
  dropdownToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 6,
  },
  dropdownSelectedText: {
    fontSize: 12,
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
    paddingHorizontal: 10,
  },
  dropdownText: {
    fontSize: 12,
    color: '#444',
  },
  savingsRowBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 10,
  },
  savingsButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFDE7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FFE082',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  savingsLabel: {
    fontSize: 12,
    color: '#555',
  },
  savingsValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2A38',
  },
  scrollContent: {
    paddingBottom: 16,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    elevation: 1,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  goalTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E2A38',
  },
  goalAmount: {
    fontSize: 12,
    color: '#666',
  },
  progressBarBackground: {
    height: 8,
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  overspendingBox: {
    backgroundColor: '#FFEBEE',
    borderColor: '#D32F2F',
    borderWidth: 1,
    padding: 10,
    marginTop: 6,
    borderRadius: 6,
  },
  overspendingText: {
    color: '#C62828',
    fontSize: 12,
    fontWeight: '500',
  },
  noGoalsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 20,
  },
  goalAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteIcon: {
    padding: 6,
    backgroundColor: '#FFF0F0',
    borderRadius: 20,
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
