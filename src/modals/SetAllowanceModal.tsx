import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import Modal from 'react-native-modal';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import CustomAlert from '../components/CustomAlert';
import {getUser} from '../utils/authStorage';
import Config from 'react-native-config';

interface Props {
  visible: boolean;
  allowance: string;
  limit: string;
  range: string;
  onChangeAllowance: (text: string) => void;
  onChangeLimit: (text: string) => void;
  onChangeRange: (text: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

export default function SetAllowanceModal({
  visible,
  allowance,
  limit,
  onChangeAllowance,
  onChangeLimit,
  onChangeRange,
  onSave,
  onCancel,
}: Props) {
  const numericAllowance = parseFloat(allowance) || 0;
  const numericLimit = parseFloat(limit) || 0;
  const limitPercentage = numericAllowance
    ? Math.min((numericLimit / numericAllowance) * 100, 100)
    : 0;

  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showInfo, setShowInfo] = useState(false);

  const handleSliderChange = (value: number) => {
    if (numericAllowance > 0) {
      const computedLimit = (numericAllowance * value) / 100;
      onChangeLimit(computedLimit.toFixed(0));
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (!selectedDate) {
      return;
    }

    if (pickerMode === 'start') {
      setStartDate(selectedDate);
      setEndDate(null);
      onChangeRange('');
    } else if (pickerMode === 'end') {
      if (startDate && selectedDate < startDate) {
        setAlertMessage('End date cannot be before start date.');
        setAlertVisible(true);
        return;
      }

      setEndDate(selectedDate);
      const rangeStr = `${startDate?.toLocaleDateString(
        'en-US',
      )} - ${selectedDate.toLocaleDateString('en-US')}`;
      onChangeRange(rangeStr);
    }
  };

  const validateAndSave = async () => {
    const allowanceValue = Number(allowance);
    const limitValue = Number(limit);

    if (!allowance || isNaN(allowanceValue) || allowanceValue <= 0) {
      setAlertMessage('Please enter a valid allowance amount.');
      setAlertVisible(true);
      return;
    }

    if (
      !limit ||
      isNaN(limitValue) ||
      limitValue <= 0 ||
      limitValue > allowanceValue
    ) {
      setAlertMessage('Please set a valid spending limit.');
      setAlertVisible(true);
      return;
    }

    if (!startDate || !endDate) {
      setAlertMessage('Please select both a start and end date.');
      setAlertVisible(true);
      return;
    }

    const user = await getUser();
    if (!user || !user.user_id) {
      setAlertMessage('User not found. Please login again.');
      setAlertVisible(true);
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${Config.API_BASE_URL}/api/allowances`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          user_id: user.user_id,
          amount: allowanceValue,
          spending_limit: limitValue,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        setAlertMessage(result.error || 'Failed to save allowance.');
        setAlertVisible(true);
        return;
      }

      onSave();
    } catch (err) {
      console.error('Save allowance error:', err);
      setAlertMessage('An unexpected error occurred.');
      setAlertVisible(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Modal
        isVisible={visible}
        backdropOpacity={0.5}
        animationIn="zoomIn"
        animationOut="zoomOut"
        onBackdropPress={onCancel}
        onBackButtonPress={onCancel}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Set New Allowance</Text>

          <TextInput
            style={styles.input}
            placeholder="Allowance (₱)"
            keyboardType="numeric"
            value={allowance}
            onChangeText={onChangeAllowance}
          />

          {showInfo && (
            <View style={styles.infoBox}>
              <Text style={styles.infoTitle}>Why set a spending limit?</Text>
              <Text style={styles.infoMessage}>
                This lets you control how much of your allowance is meant for
                spending. Anything beyond the limit can be allocated for
                saving goals, or emergencies.
              </Text>
              <TouchableOpacity
                style={styles.dismissInfoButton}
                onPress={() => setShowInfo(false)}>
                <Text style={styles.dismissInfoText}>Got it</Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.sliderLabelRow}>
            <View style={styles.sliderLabelWithIcon}>
              <Text style={styles.sliderLabel}>
                Spending Limit (₱{limit || '0'})
              </Text>
              <TouchableOpacity onPress={() => setShowInfo(true)}>
                <Text style={styles.infoIcon}>ℹ️</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sliderPercentage}>
              {Math.round(limitPercentage)}%
            </Text>
          </View>

          <Slider
            style={{width: '100%', height: 40}}
            minimumValue={0}
            maximumValue={100}
            step={1}
            value={limitPercentage}
            onValueChange={handleSliderChange}
            minimumTrackTintColor="#4CAF50"
            maximumTrackTintColor="#ccc"
            thumbTintColor="#4CAF50"
            disabled={!numericAllowance}
          />

          <TextInput
            style={[styles.input, {backgroundColor: '#f3f3f3'}]}
            placeholder="Limit (computed)"
            value={limit}
            editable={false}
          />

          <Text style={styles.allowanceDateRangeText}>
            Allowance Date Range
          </Text>

          <View style={styles.dateRow}>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setPickerMode('start');
                setShowPicker(true);
              }}>
              <Text style={styles.dateText}>
                {startDate
                  ? startDate.toLocaleDateString('en-US')
                  : 'Start Date'}
              </Text>
            </TouchableOpacity>

            <Text style={styles.dateSeparator}>–</Text>

            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => {
                setPickerMode('end');
                setShowPicker(true);
              }}>
              <Text style={styles.dateText}>
                {endDate ? endDate.toLocaleDateString('en-US') : 'End Date'}
              </Text>
            </TouchableOpacity>
          </View>

          {showPicker && (
            <DateTimePicker
              value={new Date()}
              mode="date"
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={handleDateChange}
            />
          )}

          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#4CAF50'}]}
              onPress={validateAndSave}
              disabled={loading}>
              {loading ? (
                <Text style={styles.modalButtonText}>Saving...</Text>
              ) : (
                <Text style={styles.modalButtonText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modalButton, {backgroundColor: '#ccc'}]}
              onPress={onCancel}
              disabled={loading}>
              <Text style={[styles.modalButtonText, {color: '#333'}]}>
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <CustomAlert
        visible={alertVisible}
        message={alertMessage}
        onClose={() => setAlertVisible(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 16,
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    marginBottom: 10,
  },
  sliderLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 4,
  },
  sliderLabel: {
    fontSize: 13,
    color: '#1E2A38',
  },
  sliderPercentage: {
    fontSize: 13,
    color: '#4CAF50',
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
    marginHorizontal: 5,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  allowanceDateRangeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 10,
    marginTop: 20,
  },
  dateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 10,
    marginBottom: 10,
  },
  dateSeparator: {
    alignSelf: 'center',
    fontSize: 16,
    color: '#555',
  },
  dateButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  dateText: {
    fontSize: 13,
    color: '#888',
  },
  sliderLabelWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoIcon: {
    fontSize: 14,
    color: '#888',
  },
  infoText: {
    fontSize: 12,
    color: '#555',
    marginBottom: 10,
    marginTop: -4,
  },
  infoBox: {
    width: '100%',
    backgroundColor: '#F1F8E9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#8BC34A',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#33691E',
    marginBottom: 6,
  },
  infoMessage: {
    fontSize: 12,
    color: '#4E5D6A',
    lineHeight: 18,
  },
  dismissInfoButton: {
    marginTop: 8,
    alignSelf: 'flex-end',
    backgroundColor: '#8BC34A',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  dismissInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});
