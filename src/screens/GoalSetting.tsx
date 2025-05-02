import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AddGoalModal from '../modals/AddGoalModal';

interface Goal {
  id: number;
  title: string;
  targetAmount: number;
  currentAmount: number;
}

export default function GoalSettingScreen() {
  const [goals, setGoals] = useState<Goal[]>([
    { id: 1, title: 'Buy a New Laptop', targetAmount: 30000, currentAmount: 5000 },
    { id: 2, title: 'Trip to Cebu', targetAmount: 15000, currentAmount: 4000 },
    { id: 3, title: 'Emergency Fund', targetAmount: 20000, currentAmount: 8000 },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalTarget, setNewGoalTarget] = useState('');

  const handleSaveGoal = () => {
    if (newGoalTitle.trim() !== '' && newGoalTarget.trim() !== '' && !isNaN(Number(newGoalTarget))) {
      const newGoal: Goal = {
        id: Date.now(),
        title: newGoalTitle,
        targetAmount: Number(newGoalTarget),
        currentAmount: 0,
      };
      setGoals(prev => [...prev, newGoal]);
      setNewGoalTitle('');
      setNewGoalTarget('');
      setModalVisible(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>My Savings Goals</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setModalVisible(true)}
        >
          <Icon name="add-circle-outline" size={24} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {goals.map(goal => (
          <View key={goal.id} style={styles.goalCard}>
            <View style={styles.goalHeader}>
              <Text style={styles.goalTitle}>{goal.title}</Text>
              <Text style={styles.goalAmount}>
                ₱{goal.currentAmount.toLocaleString()} / ₱{goal.targetAmount.toLocaleString()}
              </Text>
            </View>
            <View style={styles.progressBarBackground}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${(goal.currentAmount / goal.targetAmount) * 100}%` },
                ]}
              />
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Modal to Add Goal */}
      <AddGoalModal
        visible={modalVisible}
        goalName={newGoalTitle}
        targetAmount={newGoalTarget}
        onChangeGoalName={setNewGoalTitle}
        onChangeTargetAmount={setNewGoalTarget}
        onSave={handleSaveGoal}
        onCancel={() => setModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F9FB',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E2A38',
  },
  addButton: {
    backgroundColor: '#E8F5E9',
    padding: 8,
    borderRadius: 30,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  noGoalsText: {
    fontSize: 14,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  goalCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
  },
  goalAmount: {
    fontSize: 13,
    color: '#666',
  },
  progressBarBackground: {
    height: 10,
    width: '100%',
    backgroundColor: '#eee',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
});
