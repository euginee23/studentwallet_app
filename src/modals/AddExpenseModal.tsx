import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  description: string;
  amount: string;
  category: string;
  onChangeDescription: (text: string) => void;
  onChangeAmount: (text: string) => void;
  onSelectCategory: (category: string) => void;
  onSave: () => void;
  onCancel: () => void;
  allowanceId: number | null;
}

interface CategoryItem {
  category_name: string;
  is_default: boolean;
}

export default function AddExpenseModal({
  visible,
  description,
  amount,
  category,
  onChangeDescription,
  onChangeAmount,
  onSelectCategory,
  onSave,
  onCancel,
  allowanceId,
}: Props) {
  const [customCategories, setCustomCategories] = useState<CategoryItem[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [showAddInput, setShowAddInput] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [addingCategory, setAddingCategory] = useState(false);
  const [savingExpense, setSavingExpense] = useState(false);
  const [longPressedCategory, setLongPressedCategory] = useState<string | null>(
    null,
  );
  const [deletingCategory, setDeletingCategory] = useState(false);

  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const user = await getUser();
        const response = await fetch(
          `${Config.API_BASE_URL}/api/expense-categories/${user.user_id}`,
        );
        const data = await response.json();

        if (response.ok && Array.isArray(data.categories)) {
          setCustomCategories(data.categories);
        } else {
          console.error('Failed to fetch categories:', data.error);
        }
      } catch (err) {
        console.error('Category fetch error:', err);
      } finally {
        setLoadingCategories(false);
      }
    };

    if (visible) {
      fetchCategories();
    }
  }, [visible]);

  const handleAddCategory = async () => {
    if (
      newCategory.trim() === '' ||
      customCategories.some(
        c => c.category_name.toLowerCase() === newCategory.trim().toLowerCase(),
      )
    ) {
      return;
    }

    setAddingCategory(true);
    try {
      const user = await getUser();
      const response = await fetch(
        `${Config.API_BASE_URL}/api/expense-categories`,
        {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            category_name: newCategory,
            user_id: user.user_id,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomCategories([
          ...customCategories,
          {category_name: newCategory, is_default: false},
        ]);
        setNewCategory('');
        setShowAddInput(false);
      } else {
        console.error('Failed to save category:', data.error);
      }
    } catch (error) {
      console.error('Error adding category:', error);
    } finally {
      setAddingCategory(false);
    }
  };

  const handleDeleteCategory = async (categoryName: string) => {
    const protectedDefaults = [
      'Food',
      'Transportation',
      'Entertainment',
      'Education',
      'Others',
    ];
    if (protectedDefaults.includes(categoryName)) {
      Alert.alert(
        'Not Allowed',
        `"${categoryName}" is a default category and cannot be deleted.`,
      );
      return;
    }

    try {
      const user = await getUser();
      setDeletingCategory(true);

      const response = await fetch(
        `${Config.API_BASE_URL}/api/expense-categories`,
        {
          method: 'DELETE',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({
            user_id: user.user_id,
            category_name: categoryName,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setCustomCategories(prev =>
          prev.filter(c => c.category_name !== categoryName),
        );
        setLongPressedCategory(null);
      } else {
        console.error('Failed to delete category:', data.error);
      }
    } catch (error) {
      console.error('Delete category error:', error);
    } finally {
      setDeletingCategory(false);
    }
  };

  const handleSave = async () => {
    if (!category.trim()) {
      Alert.alert('Error', 'Please select a category.');
      return;
    }

    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid expense amount.');
      return;
    }

    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a description.');
      return;
    }

    setSavingExpense(true);
    try {
      const user = await getUser();

      const response = await fetch(
        `${Config.API_BASE_URL}/api/balance-history`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            user_id: user.user_id,
            balance_type: 'Expense',
            category,
            description,
            amount,
            allowance_id: allowanceId,
          }),
        },
      );

      const data = await response.json();

      if (response.ok && data.success) {
        Alert.alert('Success', 'Expense recorded successfully.');
        setTimeout(async () => {
          await onSave();
          onCancel();
        }, 300);
      } else {
        Alert.alert('Error', data.error || 'Failed to save expense.');
      }
    } catch (error) {
      console.error('Save expense error:', error);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setSavingExpense(false);
    }
  };

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>New Expense</Text>

        <Text style={styles.sectionLabel}>Select Category</Text>

        {!showAddInput ? (
          <TouchableOpacity
            style={styles.addCategoryToggle}
            onPress={() => setShowAddInput(true)}>
            <Icon name="add" size={18} color="#4CAF50" />
            <Text style={styles.addCategoryToggleText}>Add Category</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputWithButton}>
            <TextInput
              style={styles.categoryInput}
              placeholder="New Category"
              value={newCategory}
              onChangeText={setNewCategory}
            />
            <View style={styles.addButtonsRow}>
              <TouchableOpacity
                style={[styles.iconButton, {backgroundColor: '#4CAF50'}]}
                onPress={handleAddCategory}
                disabled={addingCategory}>
                {addingCategory ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <Icon name="checkmark" size={18} color="#fff" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.iconButton,
                  {backgroundColor: '#E53935', marginLeft: 8},
                ]}
                onPress={() => {
                  setNewCategory('');
                  setShowAddInput(false);
                }}>
                <Icon name="close" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.categoryList}>
          {loadingCategories ? (
            <Text style={{textAlign: 'center', padding: 8, color: '#777'}}>
              Loading categories...
            </Text>
          ) : (
            <ScrollView showsVerticalScrollIndicator>
              {customCategories.map(({category_name}, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.categoryOption,
                    category === category_name && styles.selectedCategory,
                  ]}
                  onPress={() => {
                    onSelectCategory(category_name);
                    setLongPressedCategory(null); // Reset icon on normal tap
                  }}
                  onLongPress={() => {
                    const protectedDefaults = [
                      'Food',
                      'Transportation',
                      'Entertainment',
                      'Education',
                      'Others',
                    ];

                    if (protectedDefaults.includes(category_name)) {
                      Alert.alert(
                        'Not Allowed',
                        `"${category_name}" is a default category and cannot be deleted.`,
                      );
                    } else {
                      setLongPressedCategory(category_name);
                    }
                  }}>
                  <View style={{flexDirection: 'row', alignItems: 'center'}}>
                    <Text
                      style={
                        category === category_name
                          ? styles.selectedCategoryText
                          : styles.categoryText
                      }>
                      {category_name}
                    </Text>

                    {longPressedCategory === category_name && (
                      <TouchableOpacity
                        style={{marginLeft: 8}}
                        onPress={() => {
                          Alert.alert(
                            'Delete Category',
                            `Are you sure you want to delete "${category_name}"?`,
                            [
                              {text: 'Cancel', style: 'cancel'},
                              {
                                text: 'Delete',
                                style: 'destructive',
                                onPress: () =>
                                  handleDeleteCategory(category_name),
                              },
                            ],
                          );
                        }}>
                        {deletingCategory ? (
                          <ActivityIndicator size={16} color="#E53935" />
                        ) : (
                          <Icon
                            name="trash-outline"
                            size={16}
                            color="#E53935"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        <Text style={styles.sectionLabel}>Amount</Text>
        <TextInput
          style={styles.input}
          placeholder="₱ Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={onChangeAmount}
        />

        <Text style={styles.sectionLabel}>Description</Text>
        <TextInput
          style={[styles.input, styles.descriptionInput]}
          placeholder="Add a short note"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={onChangeDescription}
        />

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, {backgroundColor: '#4CAF50'}]}
            onPress={handleSave}
            disabled={savingExpense}>
            {savingExpense ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.modalButtonText}>Add Expense</Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, {backgroundColor: '#ccc'}]}
            onPress={onCancel}>
            <Text style={[styles.modalButtonText, {color: '#333'}]}>
              Cancel
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    maxHeight: '90%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 10,
    color: '#1E2A38',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1E2A38',
    alignSelf: 'flex-start',
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    marginBottom: 6,
  },
  descriptionInput: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  addCategoryToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginBottom: 6,
  },
  addCategoryToggleText: {
    marginLeft: 6,
    color: '#4CAF50',
    fontWeight: '600',
    fontSize: 13,
  },
  inputWithButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    position: 'relative',
  },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingRight: 40,
    paddingVertical: 10,
    fontSize: 14,
  },
  addButtonsRow: {
    position: 'absolute',
    right: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    padding: 7,
    borderRadius: 50,
  },
  categoryList: {
    width: '100%',
    maxHeight: 150,
    marginBottom: 10,
    borderTopWidth: 0.5,
    borderBottomWidth: 0.5,
    borderColor: '#ccc',
  },
  categoryOption: {
    backgroundColor: '#eee',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginVertical: 3,
    alignSelf: 'flex-start',
    marginRight: 6,
    marginTop: 10,
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
    marginTop: 10,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
});
