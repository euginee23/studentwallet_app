import React, { useState } from 'react';
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
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function VerificationCodeModal({
  email,
  visible,
  onClose,
  onSuccess,
}: Props) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);

  const handleVerify = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code.');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch(`${Config.API_BASE_URL}/api/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code: code.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', data.message);
        onSuccess();
      } else {
        Alert.alert('Error', data.error || 'Invalid verification code');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Something went wrong during verification.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.modalContainer}>
        <View style={styles.card}>
          <Text style={styles.title}>Verification Code</Text>
          <Text style={styles.subtitle}>
            Enter the code we sent to your email.
          </Text>

          <TextInput
            style={styles.codeInput}
            value={code}
            onChangeText={setCode}
            keyboardType="default"
            autoCapitalize="characters"
            maxLength={6}
            placeholder="XXXXXX"
            placeholderTextColor="#999"
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleVerify}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Verify</Text>
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
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    width: '100%',
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 16,
  },
  codeInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    fontSize: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    textAlign: 'center',
    letterSpacing: 4,
    marginBottom: 16,
    color: '#333',
  },
  button: {
    backgroundColor: '#4caf50',
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
