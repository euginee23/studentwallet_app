import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import Modal from 'react-native-modal';
import Icon from 'react-native-vector-icons/Ionicons';

interface Props {
  visible: boolean;
  description: string;
  amount: string;
  category: string;
  categories: string[];
  onChangeDescription: (text: string) => void;
  onChangeAmount: (text: string) => void;
  onSelectCategory: (category: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function AddExpenseModal({
  visible,
  description,
  amount,
  category,
  categories,
  onChangeDescription,
  onChangeAmount,
  onSelectCategory,
  onSave,
  onCancel,
}: Props) {
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState('');

  const handleAddCategory = () => {
    if (newCategory.trim() !== '' && !customCategories.includes(newCategory)) {
      setCustomCategories([...customCategories, newCategory]);
      setNewCategory('');
    }
  };

  const combinedCategories = [...categories, ...customCategories];

  return (
    <Modal
      isVisible={visible}
      backdropOpacity={0.5}
      animationIn="zoomIn"
      animationOut="zoomOut"
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
    >
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Add New Expense</Text>

        <TextInput
          style={styles.input}
          placeholder="Description"
          value={description}
          onChangeText={onChangeDescription}
        />
        <TextInput
          style={styles.input}
          placeholder="₱ Amount"
          keyboardType="numeric"
          value={amount}
          onChangeText={onChangeAmount}
        />

        <Text style={styles.categoryHeaderText}>Categories</Text>

        {/* Input with Plus Button */}
        <View style={styles.inputWithButton}>
          <TextInput
            style={styles.categoryInput}
            placeholder="New Category"
            value={newCategory}
            onChangeText={setNewCategory}
          />
          <TouchableOpacity style={styles.addInsideButton} onPress={handleAddCategory}>
            <Icon name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Category List */}
        <ScrollView style={styles.categoryList}>
          {combinedCategories.map((cat, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.categoryOption,
                category === cat && styles.selectedCategory,
              ]}
              onPress={() => onSelectCategory(cat)}
            >
              <Text style={category === cat ? styles.selectedCategoryText : styles.categoryText}>
                {cat}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Buttons */}
        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#4CAF50' }]}
            onPress={onSave}
          >
            <Text style={styles.modalButtonText}>Save</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modalButton, { backgroundColor: '#ccc' }]}
            onPress={onCancel}
          >
            <Text style={[styles.modalButtonText, { color: '#333' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    maxHeight: '90%',
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
  categoryHeaderText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  inputWithButton: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    position: 'relative',
  },
  categoryInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingRight: 42,
    paddingVertical: 12,
    fontSize: 15,
  },
  addInsideButton: {
    position: 'absolute',
    right: 8,
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 50,
  },
  categoryList: {
    width: '100%',
    maxHeight: 150,
    marginBottom: 20,
  },
  categoryOption: {
    backgroundColor: '#eee',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginVertical: 4,
    alignSelf: 'flex-start',
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
