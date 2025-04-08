import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
} from 'react-native';

interface Props {
  visible: boolean;
  users: {
    first_name: string;
    last_name: string;
    email: string;
    contact_number: string;
    username: string;
  }[];
  onClose: () => void;
}

export default function ExistingUserModal({ visible, users, onClose }: Props) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <Text style={styles.title}>Account Already Registered</Text>
          <Text style={styles.subtitle}>
            The following account(s) already exist with the same email or phone:
          </Text>

          <FlatList
            data={users}
            keyExtractor={(_, index) => index.toString()}
            contentContainerStyle={{ gap: 12 }}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <Text style={styles.userName}>
                  {item.first_name} {item.last_name}
                </Text>
                <Text style={styles.userInfo}>📧 {item.email}</Text>
                <Text style={styles.userInfo}>📱 {item.contact_number}</Text>
                <Text style={styles.userInfo}>👤 {item.username}</Text>
              </View>
            )}
          />

          <TouchableOpacity style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>OK, Got It</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxHeight: '85%',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
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
    textAlign: 'center',
    marginBottom: 16,
  },
  userCard: {
    backgroundColor: '#f1f5f9',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userName: {
    fontWeight: '600',
    fontSize: 16,
    marginBottom: 6,
    color: '#333',
  },
  userInfo: {
    fontSize: 14,
    color: '#444',
    marginBottom: 2,
  },
  button: {
    marginTop: 20,
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
});
