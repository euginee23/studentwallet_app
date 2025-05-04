import React, {useEffect, useState} from 'react';
import axios from 'axios';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {PieChart} from 'react-native-chart-kit';
import AllowanceHistoryModal from '../modals/AllowanceHistoryModal';

const screenWidth = Dimensions.get('window').width;

export default function DashboardScreen() {
  const [totalAllowance, setTotalAllowance] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalSavings, setTotalSavings] = useState(0);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [allowanceHistory, setAllowanceHistory] = useState<
    {
      start_date: string;
      end_date: string;
      amount: number;
      description: string;
    }[]
  >([]);

  const expenseData = [
    {name: 'Food', amount: 800, color: '#FF6384', icon: ''},
    {name: 'Transportation', amount: 400, color: '#36A2EB', icon: ''},
    {name: 'Education', amount: 600, color: '#FFCE56', icon: ''},
    {name: 'Entertainment', amount: 300, color: '#4BC0C0', icon: ''},
    {name: 'Others', amount: 400, color: '#9966FF', icon: ''},
  ];

  const pieChartData = expenseData.map(item => ({
    name: item.name,
    population: item.amount,
    color: item.color,
    legendFontColor: '#333',
    legendFontSize: 10,
  }));

  const fetchSummary = async () => {
    try {
      const user = await getUser();
      const res = await axios.get(
        `${Config.API_BASE_URL}/api/dashboard-summary/${user.user_id}`,
      );

      const {
        totalAllowance = 0,
        totalExpenses = 0,
        totalSavings = 0,
        remainingBalance = 0,
      } = res.data || {};

      setTotalAllowance(Number(totalAllowance));
      setTotalExpenses(Number(totalExpenses));
      setTotalSavings(Number(totalSavings));
      setRemainingBalance(Number(remainingBalance));
    } catch (error) {
      console.error('Failed to fetch dashboard summary:', error);
    }
  };

  const fetchAllowanceHistory = async () => {
    try {
      const user = await getUser();
      const res = await axios.get(
        `${Config.API_BASE_URL}/api/allowance-income-history/${user.user_id}`,
      );
      setAllowanceHistory(res.data);
    } catch (err) {
      console.error('Failed to fetch allowance income history:', err);
    }
  };

  useEffect(() => {
    const runFetches = async () => {
      await fetchSummary();
      await fetchAllowanceHistory();
    };

    runFetches();
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.scrollContent}>
      <View style={styles.wrapper}>
        <View style={styles.container}>
          {/* Total Allowance Card */}
          <View style={styles.balanceCard}>
            <TouchableOpacity
              style={styles.balanceTap}
              onPress={() => {
                fetchAllowanceHistory();
                setHistoryModalVisible(true);
              }}>
              <Text style={styles.balanceAmount}>
                ₱{totalAllowance.toFixed(2)}
              </Text>
              <View style={styles.rowWithArrow}>
                <Text style={styles.balanceLabel}>Total Allowance</Text>
                <Icon
                  name="chevron-forward-outline"
                  size={14}
                  color="#B0BEC5"
                />
              </View>
            </TouchableOpacity>

            {/* Fund Summary */}
            <View style={styles.fundBreakdown}>
              <TouchableOpacity style={styles.fundBoxFull}>
                <View style={styles.rowWithArrow}>
                  <Text style={styles.fundTitle}>Total Remaining Balance</Text>
                  <Icon
                    name="chevron-forward-outline"
                    size={12}
                    color="#B0BEC5"
                  />
                </View>
                <Text style={styles.fundValue}>
                  ₱{remainingBalance.toFixed(2)}
                </Text>
              </TouchableOpacity>

              <View style={styles.fundBoxRow}>
                <TouchableOpacity style={styles.fundBoxHalf}>
                  <View style={styles.rowWithArrow}>
                    <Text style={styles.fundTitle}>Total Expenses</Text>
                    <Icon
                      name="chevron-forward-outline"
                      size={12}
                      color="#B0BEC5"
                    />
                  </View>
                  <Text style={styles.fundValue}>
                    ₱{totalExpenses.toFixed(2)}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.fundBoxHalf}>
                  <View style={styles.rowWithArrow}>
                    <Text style={styles.fundTitle}>Total Savings</Text>
                    <Icon
                      name="chevron-forward-outline"
                      size={12}
                      color="#B0BEC5"
                    />
                  </View>
                  <Text style={styles.fundValue}>
                    ₱{totalSavings.toFixed(2)}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Pie Chart */}
          <View style={styles.chartCard}>
            <Text style={styles.sectionTitle}>Spending Breakdown</Text>
            <PieChart
              data={pieChartData}
              width={screenWidth - 60}
              height={180}
              chartConfig={{
                color: () => '#333',
                labelColor: () => '#333',
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="10"
              absolute
            />
          </View>

          {/* Expense Categories */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Expense Categories</Text>
            {expenseData.map((item, index) => (
              <View key={index} style={styles.expenseRow}>
                <View
                  style={[styles.colorDot, {backgroundColor: item.color}]}
                />
                <Text style={styles.expenseLabel}>
                  {item.icon} {item.name}
                </Text>
                <Text style={styles.expenseAmount}>₱{item.amount}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>

      <AllowanceHistoryModal
        visible={historyModalVisible}
        onClose={() => setHistoryModalVisible(false)}
        history={allowanceHistory}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    backgroundColor: '#F7F9FB',
  },
  wrapper: {
    flex: 1,
  },
  container: {
    flex: 1,
    padding: 12,
  },
  balanceCard: {
    backgroundColor: '#1E2A38',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 14,
  },
  balanceTap: {
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#B0BEC5',
  },
  rowWithArrow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  fundBreakdown: {
    width: '100%',
    gap: 8,
  },
  fundBoxFull: {
    backgroundColor: '#263343',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F3B51',
    alignItems: 'center',
  },
  fundBoxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  fundBoxHalf: {
    flex: 1,
    backgroundColor: '#263343',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2F3B51',
    alignItems: 'center',
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
    borderRadius: 12,
    padding: 14,
    marginBottom: 14,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    alignSelf: 'flex-start',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomColor: '#eee',
    borderBottomWidth: 1,
  },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 8,
  },
  expenseLabel: {
    flex: 1,
    fontSize: 12,
    color: '#444',
  },
  expenseAmount: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
});
