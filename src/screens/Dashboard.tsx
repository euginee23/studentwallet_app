import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {PieChart} from 'react-native-chart-kit';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const totalAllowance = 5000;
  const totalExpenses = 2500;
  const availableFunds = totalAllowance - totalExpenses;

  const expenseData = [
    {name: 'Food', amount: 800, color: '#FF6384', icon: '🍔'},
    {name: 'Transportation', amount: 400, color: '#36A2EB', icon: '🚌'},
    {name: 'Education', amount: 600, color: '#FFCE56', icon: '📚'},
    {name: 'Entertainment', amount: 300, color: '#4BC0C0', icon: '🎮'},
    {name: 'Others', amount: 400, color: '#9966FF', icon: '📦'},
  ];

  const pieChartData = expenseData.map(item => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: '#333',
    legendFontSize: 12,
  }));

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Available Funds Card */}
      <View style={styles.balanceCard}>
        <TouchableOpacity style={styles.balanceTap}>
          <Text style={styles.balanceAmount}>₱{availableFunds.toFixed(2)}</Text>
          <View style={styles.rowWithArrow}>
            <Text style={styles.balanceLabel}>Available Funds</Text>
            <Icon name="chevron-forward-outline" size={16} color="#B0BEC5" />
          </View>
        </TouchableOpacity>

        <View style={styles.fundBreakdownRow}>
          <TouchableOpacity style={styles.fundBox}>
            <View style={styles.rowWithArrow}>
              <Text style={styles.fundTitle}>Allowance</Text>
              <Icon name="chevron-forward-outline" size={14} color="#B0BEC5" />
            </View>
            <Text style={styles.fundValue}>₱{totalAllowance.toFixed(2)}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.fundBox}>
            <View style={styles.rowWithArrow}>
              <Text style={styles.fundTitle}>Expenses</Text>
              <Icon name="chevron-forward-outline" size={14} color="#B0BEC5" />
            </View>
            <Text style={styles.fundValue}>₱{totalExpenses.toFixed(2)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Spending Breakdown Card */}
      <View style={styles.chartCard}>
        <Text style={styles.sectionTitle}>Spending Breakdown</Text>
        <PieChart
          data={pieChartData}
          width={screenWidth - 80}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: () => '#333',
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Expense Categories */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Expense Categories</Text>
        {expenseData.map((item, index) => (
          <View key={index} style={styles.expenseRow}>
            <View style={[styles.colorDot, {backgroundColor: item.color}]} />
            <Text style={styles.expenseLabel}>
              {item.icon} {item.name}
            </Text>
            <Text style={styles.expenseAmount}>₱{item.amount}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F9FB',
  },
  balanceCard: {
    backgroundColor: '#1E2A38',
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: {width: 0, height: 4},
    shadowRadius: 8,
    elevation: 4,
  },
  balanceTap: {
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#B0BEC5',
    marginTop: 4,
  },
  rowWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  fundBreakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
    width: '100%',
  },
  fundBox: {
    flex: 1,
    backgroundColor: '#263343',
    paddingVertical: 12,
    paddingHorizontal: 10,
    marginHorizontal: 4,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2F3B51',
  },
  fundTitle: {
    fontSize: 12,
    color: '#B0BEC5',
    marginBottom: 4,
  },
  fundValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
    elevation: 3,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#333',
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    elevation: 3,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  expenseLabel: {
    flex: 1,
    fontSize: 13,
    color: '#444',
  },
  expenseAmount: {
    fontWeight: '600',
    color: '#333',
    fontSize: 13,
  },
});
