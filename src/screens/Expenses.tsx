import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import AddExpenseModal from '../modals/AddExpenseModal';

export default function ExpensesScreen() {
  const [expenses, setExpenses] = useState([
    {
      description: 'Lunch at Canteen',
      amount: 120,
      category: 'Food',
      date: 'Apr 26, 2025',
    },
    {
      description: 'Bus Fare',
      amount: 50,
      category: 'Transportation',
      date: 'Apr 26, 2025',
    },
    {
      description: 'Notebook',
      amount: 70,
      category: 'Education',
      date: 'Apr 25, 2025',
    },
  ]);

  const [modalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('Food');

  const categories = [
    'Food',
    'Transportation',
    'Education',
    'Entertainment',
    'Others',
  ];

  const handleAddExpense = () => {
    if (description.trim() !== '' && !isNaN(Number(amount)) && category) {
      const today = new Date()
        .toLocaleDateString('en-US', {
          month: 'short',
          day: '2-digit',
          year: 'numeric',
        })
        .replace(',', '');
      setExpenses([
        ...expenses,
        {
          description,
          amount: Number(amount),
          category,
          date: today,
        },
      ]);
      setModalVisible(false);
      setDescription('');
      setAmount('');
      setCategory('Food');
    }
  };

  return (
    <View style={styles.container}>
      {/* Add Expense Button */}
      <TouchableOpacity
        activeOpacity={0.8}
        style={styles.addButton}
        onPress={() => setModalVisible(true)}>
        <Icon name="add-circle-outline" size={22} color="#4CAF50" />
        <Text style={styles.addButtonText}>Add New Expense</Text>
      </TouchableOpacity>

      {/* Expenses List */}
      <ScrollView contentContainerStyle={styles.expenseList}>
        {expenses.map((item, index) => (
          <View key={index} style={styles.expenseItem}>
            <View>
              <Text style={styles.expenseDesc}>{item.description}</Text>
              <Text style={styles.expenseMeta}>
                {item.category} • {item.date}
              </Text>
            </View>
            <Text style={styles.expenseAmount}>
              -₱
              {item.amount.toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
            </Text>
          </View>
        ))}
      </ScrollView>

      {/* Modal */}
      <AddExpenseModal
        visible={modalVisible}
        description={description}
        amount={amount}
        category={category}
        categories={categories}
        onChangeDescription={setDescription}
        onChangeAmount={setAmount}
        onSelectCategory={setCategory}
        onSave={handleAddExpense}
        onCancel={() => setModalVisible(false)}
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  expenseDesc: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E2A38',
  },
  expenseMeta: {
    fontSize: 12,
    color: '#888',
    marginTop: 2,
  },
  expenseAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#E53935',
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
    marginBottom: 20,
    color: '#1E2A38',
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
  categoryPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 20,
  },
  categoryOption: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    margin: 5,
  },
  selectedCategory: {
    backgroundColor: '#4CAF50',
  },
  categoryText: {
    fontSize: 13,
    color: '#444',
  },
  selectedCategoryText: {
    fontSize: 13,
    color: '#fff',
    fontWeight: '600',
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
