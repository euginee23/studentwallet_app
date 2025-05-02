import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

export default function ReportsScreen() {
  const [selectedRange, setSelectedRange] = useState<'Weekly' | 'Monthly'>('Weekly');

  // Dummy Static Data
  const data = {
    Weekly: {
      income: 3000,
      expenses: 1800,
      savings: 1200,
    },
    Monthly: {
      income: 12000,
      expenses: 7200,
      savings: 4800,
    },
  };

  const summary = data[selectedRange];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={styles.title}>Financial Report</Text>
        <View style={styles.rangeSelector}>
          <TouchableOpacity
            style={[
              styles.rangeButton,
              selectedRange === 'Weekly' && styles.activeButton,
            ]}
            onPress={() => setSelectedRange('Weekly')}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === 'Weekly' && styles.activeButtonText,
              ]}
            >
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.rangeButton,
              selectedRange === 'Monthly' && styles.activeButton,
            ]}
            onPress={() => setSelectedRange('Monthly')}
          >
            <Text
              style={[
                styles.rangeButtonText,
                selectedRange === 'Monthly' && styles.activeButtonText,
              ]}
            >
              Monthly
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Income</Text>
        <Text style={[styles.summaryAmount, { color: '#4CAF50' }]}>
          ₱{summary.income.toLocaleString()}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Expenses</Text>
        <Text style={[styles.summaryAmount, { color: '#E53935' }]}>
          ₱{summary.expenses.toLocaleString()}
        </Text>
      </View>

      <View style={styles.summaryCard}>
        <Text style={styles.summaryLabel}>Total Savings</Text>
        <Text style={[styles.summaryAmount, { color: '#1E88E5' }]}>
          ₱{summary.savings.toLocaleString()}
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F9FB',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E2A38',
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#eee',
    borderRadius: 20,
    overflow: 'hidden',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#888',
  },
  activeButtonText: {
    color: '#fff',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
  },
  summaryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#888',
    marginBottom: 6,
  },
  summaryAmount: {
    fontSize: 24,
    fontWeight: 'bold',
  },
});
