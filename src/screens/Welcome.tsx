import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  StatusBar,
} from 'react-native';

export default function WelcomeScreen({navigation}: any) {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1E2A38" />

      <Text style={styles.title}>Welcome to</Text>

      <Image source={require('../../assets/cover-2.png')} style={styles.logo} />

      <Text style={styles.subtitle}>Sign in to continue</Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => navigation.navigate('Login')}>
        <Text style={styles.loginText}>Login</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.registerLink}>Don’t have an account? Register</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1E2A38',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    width: 360,
    height: 280,
    resizeMode: 'contain',
    marginVertical: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 15,
    color: '#b0b8c1',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: 'transparent',
    borderColor: '#4CAF50',
    borderWidth: 2,
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 50,
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  loginText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  registerLink: {
    color: '#aab4c0',
    fontSize: 14,
    marginTop: 5,
  },
});
