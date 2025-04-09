import React, {useState} from 'react';
import {
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
  View,
  ActivityIndicator,
} from 'react-native';
import Config from 'react-native-config';
import VerificationCodeModal from '../modals/VerificationCodeModal';
import ExistingUserModal from '../modals/ExistingUserModal';
import {Image} from 'react-native';

export default function RegisterScreen({navigation}: any) {
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [existingUsers, setExistingUsers] = useState([]);
  const [showExistingModal, setShowExistingModal] = useState(false);

  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required.';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required.';
    }
    if (!email.match(/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/)) {
      newErrors.email = 'Enter a valid email.';
    }
    if (!contactNumber.match(/^9\d{9}$/)) {
      newErrors.contactNumber =
        'Enter a valid PH number (10 digits starting with 9)';
    }
    if (!username || username.length < 4) {
      newErrors.username = 'Username must be at least 4 characters.';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters.';
    }
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }
    setIsLoading(true);

    try {
      const checkRes = await fetch(`${Config.API_BASE_URL}/api/check-user`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          email,
          contactNumber,
          firstName,
          middleName,
          lastName,
          username,
          password,
        }),
      });

      const checkData = await checkRes.json();

      if (checkData.exists) {
        setExistingUsers(checkData.users);
        setShowExistingModal(true);
        return;
      }

      if (checkData.updated) {
        setModalVisible(true);
        return;
      }

      const res = await fetch(`${Config.API_BASE_URL}/api/register`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          firstName,
          middleName,
          lastName,
          email,
          contactNumber,
          username,
          password,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setModalVisible(true);
      } else {
        Alert.alert('Error', data.error || 'Registration failed');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Something went wrong.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>

      {/* Personal Info */}
      <TextInput
        placeholder="First Name"
        style={styles.input}
        value={firstName}
        onChangeText={setFirstName}
      />
      {errors.firstName && <Text style={styles.error}>{errors.firstName}</Text>}

      <TextInput
        placeholder="Middle Name (Optional)"
        style={styles.input}
        value={middleName}
        onChangeText={setMiddleName}
      />

      <TextInput
        placeholder="Last Name"
        style={styles.input}
        value={lastName}
        onChangeText={setLastName}
      />
      {errors.lastName && <Text style={styles.error}>{errors.lastName}</Text>}

      <View style={styles.emailRow}>
        <TouchableOpacity style={styles.gmailPicker}>
          <Image
            source={require('../../assets/google_logo.png')} // Adjust path if needed
            style={styles.gmailImage}
            resizeMode="contain"
          />
        </TouchableOpacity>
        <TextInput
          placeholder="Email"
          style={styles.emailInput}
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
      </View>
      {errors.email && <Text style={styles.error}>{errors.email}</Text>}

      <View style={styles.phoneRow}>
        <View style={styles.prefixContainer}>
          <Text style={styles.prefixText}>+63</Text>
        </View>
        <TextInput
          placeholder="9123456789"
          style={styles.phoneInput}
          keyboardType="number-pad"
          maxLength={10}
          value={contactNumber}
          onChangeText={text => {
            if (text.length === 1 && text === '0') {
              return;
            }
            if (/^\d*$/.test(text)) {
              setContactNumber(text);
            }
          }}
        />
      </View>
      {errors.contactNumber && (
        <Text style={styles.error}>{errors.contactNumber}</Text>
      )}

      {/* Divider */}
      <View style={styles.divider} />

      <TextInput
        placeholder="Username"
        style={styles.input}
        autoCapitalize="none"
        value={username}
        onChangeText={setUsername}
      />
      {errors.username && <Text style={styles.error}>{errors.username}</Text>}

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Password"
          style={styles.passwordInput}
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowPassword(prev => !prev)}>
          <Text style={styles.toggleText}>
            {showPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.password && <Text style={styles.error}>{errors.password}</Text>}

      <View style={styles.passwordContainer}>
        <TextInput
          placeholder="Confirm Password"
          style={styles.passwordInput}
          secureTextEntry={!showConfirmPassword}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
        />
        <TouchableOpacity
          style={styles.toggleButton}
          onPress={() => setShowConfirmPassword(prev => !prev)}>
          <Text style={styles.toggleText}>
            {showConfirmPassword ? 'Hide' : 'Show'}
          </Text>
        </TouchableOpacity>
      </View>
      {errors.confirmPassword && (
        <Text style={styles.error}>{errors.confirmPassword}</Text>
      )}
      <TouchableOpacity
        style={[styles.button, isLoading && styles.disabledButton]}
        onPress={handleRegister}
        disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.buttonText}>Register</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Login')}>
        <Text style={styles.link}>Already have an account? Login</Text>
      </TouchableOpacity>

      <ExistingUserModal
        visible={showExistingModal}
        users={existingUsers}
        onClose={() => setShowExistingModal(false)}
      />

      <VerificationCodeModal
        email={email}
        visible={isModalVisible}
        onClose={() => setModalVisible(false)}
        onSuccess={() => {
          setModalVisible(false);
          navigation.navigate('Login');
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 24,
    backgroundColor: '#fff',
    flexGrow: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#ddd',
    marginVertical: 16,
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
  },
  toggleButton: {
    paddingHorizontal: 12,
  },
  toggleText: {
    color: '#007bff',
    fontWeight: '600',
  },
  prefixContainer: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  prefixText: {
    fontSize: 15,
    color: '#333',
  },
  phoneInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#ccc',
  },
  button: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  disabledButton: {
    backgroundColor: '#388e3c',
    opacity: 0.8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
  },
  link: {
    marginTop: 20,
    textAlign: 'center',
    color: '#007bff',
  },
  error: {
    color: '#d32f2f',
    fontSize: 13,
    marginBottom: 6,
    marginLeft: 4,
  },
  emailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  gmailPicker: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderTopLeftRadius: 8,
    borderBottomLeftRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  emailInput: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopRightRadius: 8,
    borderBottomRightRadius: 8,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#ccc',
  },
  gmailImage: {
    width: 25,
    height: 20,
  },
});
