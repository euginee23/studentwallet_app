import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import Config from 'react-native-config';

interface Props {
  email: string;
  user_id: number;
  visible: boolean;
  onClose: () => void;
  onVerified: () => void;
}

export default function UpdateVerificationModal({
  email,
  user_id,
  visible,
  onClose,
  onVerified,
}: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const sendVerificationCode = async () => {
      if (!visible || !email) {return;}

      try {
        setLoading(true);
        const res = await fetch(`${Config.API_BASE_URL}/api/send-update-code`, {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({email, user_id}),
        });

        const result = await res.json();

        if (!res.ok) {
          Alert.alert(
            'Failed to Send Code',
            result.error || 'Please try again.',
          );
        }
      } catch (err) {
        console.error(err);
        Alert.alert('Error', 'Unable to send verification code.');
      } finally {
        setLoading(false);
      }
    };

    sendVerificationCode();
  }, [visible, email, user_id]);

  const handleVerification = async () => {
    if (!code.trim()) {
      Alert.alert('Missing Code', 'Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${Config.API_BASE_URL}/api/verify-update`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({ user_id, code: code.trim() }),
      });

      const result = await res.json();

      if (res.ok) {
        Alert.alert('Verified', result.message || 'Verification successful!');
        onVerified();
      } else {
        Alert.alert('Verification Failed', result.error || 'Invalid code.');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <Text style={styles.title}>Confirm Your Change</Text>
          <Text style={styles.subtitle}>
            We sent a verification code to your email. Enter it to confirm your
            update.
          </Text>

          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Enter Code"
            placeholderTextColor="#aaa"
            maxLength={6}
            keyboardType="default"
            autoCapitalize="characters"
          />

          <TouchableOpacity
            style={[styles.button, loading && {opacity: 0.6}]}
            onPress={handleVerification}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify & Continue</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: {width: 0, height: 6},
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#2e7d32',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  cancelText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#007bff',
    fontWeight: '500',
  },
});
