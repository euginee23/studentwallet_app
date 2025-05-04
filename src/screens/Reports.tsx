import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import Config from 'react-native-config';
import {getUser} from '../utils/authStorage';
import {useNavigation} from '@react-navigation/native';

export default function ReportsScreen() {
  const navigation = useNavigation<any>();
  const [selectedRange, setSelectedRange] = useState<'Weekly' | 'Monthly'>(
    'Weekly',
  );
  const [selectedWeeks, setSelectedWeeks] = useState<string[]>(['All Weeks']);

  const [summary, setSummary] = useState({
    income: 0,
    expenses: 0,
    savings: 0,
    start_date: '',
    end_date: '',
  });
  const [loading, setLoading] = useState(true);

  const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'All Weeks'];
  const months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];

  const [selectedMonth, setSelectedMonth] = useState(() => {
    const monthIndex = new Date().getMonth();
    return months[monthIndex];
  });

  const fetchReport = async (
    range: 'Weekly' | 'Monthly',
    month?: string,
    week?: string,
  ) => {
    const user = await getUser();
    if (!user?.user_id) {
      return;
    }

    setLoading(true);
    try {
      const params = new URLSearchParams({
        range: range.toLowerCase(),
        ...(month ? {month} : {}),
        ...(week ? {week} : {}),
      });

      const res = await fetch(
        `${Config.API_BASE_URL}/api/summary-report/${
          user.user_id
        }?${params.toString()}`,
      );
      const data = await res.json();
      if (res.ok) {
        setSummary(data);
      }
    } catch (err) {
      console.error('Failed to fetch report summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedRange === 'Weekly') {
      fetchReport('Weekly', selectedMonth, selectedWeeks.join(','));
    } else {
      fetchReport('Monthly', selectedMonth);
    }
  }, [selectedRange, selectedMonth, selectedWeeks]);

  const formattedRange =
    summary.start_date && summary.end_date
      ? `${new Date(summary.start_date).toLocaleDateString()} - ${new Date(
          summary.end_date,
        ).toLocaleDateString()}`
      : '';

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Report Summary</Text>
        <View style={styles.rangeSelector}>
          {['Weekly', 'Monthly'].map(range => (
            <TouchableOpacity
              key={range}
              style={[
                styles.rangeButton,
                selectedRange === range && styles.activeButton,
              ]}
              onPress={() => setSelectedRange(range as 'Weekly' | 'Monthly')}>
              <Text
                style={[
                  styles.rangeButtonText,
                  selectedRange === range && styles.activeButtonText,
                ]}>
                {range}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {selectedRange === 'Weekly' && (
        <>
          <View style={styles.dropdownContainer}>
            <Text style={styles.dropdownLabel}>Select specific month:</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dropdownRow}>
              {months.map(month => (
                <TouchableOpacity
                  key={month}
                  onPress={() => setSelectedMonth(month)}
                  style={[
                    styles.filterButton,
                    selectedMonth === month && styles.filterButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      selectedMonth === month && styles.filterButtonTextActive,
                    ]}>
                    {month}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.filterRow}>
            {weeks.map(week => {
              const isSelected = selectedWeeks.includes(week);
              return (
                <TouchableOpacity
                  key={week}
                  onPress={() => {
                    if (week === 'All Weeks') {
                      setSelectedWeeks(['All Weeks']);
                    } else {
                      setSelectedWeeks(prev => {
                        const withoutAll = prev.filter(w => w !== 'All Weeks');
                        const isSelected = withoutAll.includes(week);

                        let updated = isSelected
                          ? withoutAll.filter(w => w !== week)
                          : [...withoutAll, week];

                        const regularWeeks = [
                          'Week 1',
                          'Week 2',
                          'Week 3',
                          'Week 4',
                        ];
                        const allSelected = regularWeeks.every(w =>
                          updated.includes(w),
                        );
                        return allSelected ? ['All Weeks'] : updated;
                      });
                    }
                  }}
                  style={[
                    styles.filterButton,
                    isSelected && styles.filterButtonActive,
                  ]}>
                  <Text
                    style={[
                      styles.filterButtonText,
                      isSelected && styles.filterButtonTextActive,
                    ]}>
                    {week}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </>
      )}

      {selectedRange === 'Monthly' && (
        <View style={styles.filterRow}>
          {months.map(month => (
            <TouchableOpacity
              key={month}
              onPress={() => setSelectedMonth(month)}
              style={[
                styles.filterButton,
                selectedMonth === month && styles.filterButtonActive,
              ]}>
              <Text
                style={[
                  styles.filterButtonText,
                  selectedMonth === month && styles.filterButtonTextActive,
                ]}>
                {month}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {formattedRange !== '' && (
        <View style={styles.dateInsightContainer}>
          <Text style={styles.dateInsight}>
            Showing data from {formattedRange}
          </Text>
        </View>
      )}

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : (
        <>
          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>💰 Income</Text>
            <Text style={styles.cardSubText}>
              From Allowance and Added Funds
            </Text>
            <Text style={[styles.summaryAmount, {color: '#4CAF50'}]}>
              ₱{summary.income.toLocaleString()}
            </Text>
            <Text style={styles.linkNote}>
              Go to the{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Allowance')}>
                Allowance
              </Text>{' '}
              tab to view more.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>🧾 Expenses</Text>
            <Text style={styles.cardSubText}>Your total spending</Text>
            <Text style={[styles.summaryAmount, {color: '#E53935'}]}>
              ₱{summary.expenses.toLocaleString()}
            </Text>
            <Text style={styles.linkNote}>
              Go to the{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Expenses')}>
                Expenses
              </Text>{' '}
              tab to view more.
            </Text>
          </View>

          <View style={styles.summaryCard}>
            <Text style={styles.cardTitle}>💼 Savings</Text>
            <Text style={styles.cardSubText}>
              Saved from Balance and Allocation
            </Text>
            <Text style={[styles.summaryAmount, {color: '#1E88E5'}]}>
              ₱{summary.savings.toLocaleString()}
            </Text>
            <Text style={styles.linkNote}>
              Go to the{' '}
              <Text
                style={styles.link}
                onPress={() => navigation.navigate('Set Goals')}>
                Savings
              </Text>{' '}
              tab to view more.
            </Text>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#F7F9FB',
    minHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E2A38',
  },
  rangeSelector: {
    flexDirection: 'row',
    backgroundColor: '#E0E0E0',
    borderRadius: 16,
    overflow: 'hidden',
  },
  rangeButton: {
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  activeButton: {
    backgroundColor: '#4CAF50',
  },
  rangeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  activeButtonText: {
    color: '#fff',
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 12,
    gap: 6,
  },
  filterButton: {
    paddingVertical: 5,
    paddingHorizontal: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 12,
    margin: 4,
  },
  filterButtonActive: {
    backgroundColor: '#4CAF50',
  },
  filterButtonText: {
    fontSize: 12,
    color: '#555',
  },
  filterButtonTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowOffset: {width: 0, height: 1},
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 0.7,
    borderColor: '#ddd',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
    marginBottom: 2,
  },
  cardSubText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 8,
  },
  summaryAmount: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  linkNote: {
    fontSize: 11,
    color: '#444',
    marginTop: 8,
  },
  link: {
    color: '#4CAF50',
    fontWeight: '700',
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  dateInsightContainer: {
    backgroundColor: '#F0F4F8',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 12,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#C8D1DB',
  },
  dateInsight: {
    fontSize: 12,
    fontWeight: '500',
    color: '#2F3E4E',
  },
  dropdownRow: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    marginBottom: 8,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  dropdownContainer: {
    backgroundColor: '#EEF3F8',
    borderRadius: 12,
    padding: 8,
    marginBottom: 8,
  },
  dropdownLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 6,
    paddingLeft: 4,
  },
});
