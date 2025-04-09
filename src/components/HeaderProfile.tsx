import React, {useState} from 'react';
import {
  Image,
  TouchableOpacity,
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {logout} from '../utils/authStorage';

export default function HeaderProfileButton() {
  const [showModal, setShowModal] = useState(false);
  const navigation = useNavigation();

  const handleLogout = async () => {
    setShowModal(false);
    await logout();
    navigation.reset({
      index: 0,
      routes: [{name: 'Login'} as never],
    });
  };

  return (
    <>
      <TouchableOpacity onPress={() => setShowModal(true)}>
        <Image
          source={require('../../assets/default-profile.png')}
          style={styles.avatar}
        />
      </TouchableOpacity>

      <Modal
        transparent
        animationType="fade"
        visible={showModal}
        onRequestClose={() => setShowModal(false)}>
        <Pressable style={styles.overlay} onPress={() => setShowModal(false)}>
          <View style={styles.menuWrapper}>
            <View style={styles.triangle} />
            <View style={styles.menuContainer}>
              <Text style={styles.userLabel}>Account</Text>
              <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
                <Text style={styles.logoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  overlay: {
    flex: 1,
    backgroundColor: '#00000030',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 65,
    paddingRight: 16,
  },
  menuContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: 160,
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  userLabel: {
    fontSize: 14,
    color: '#888',
    marginBottom: 10,
    fontWeight: '600',
  },
  logoutBtn: {
    paddingVertical: 8,
  },
  logoutText: {
    color: '#E74C3C',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuWrapper: {
    alignItems: 'flex-end',
  },
  triangle: {
    width: 0,
    height: 0,
    borderLeftWidth: 9,
    borderRightWidth: 9,
    borderBottomWidth: 15,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#fff',
    marginRight: 18,
    marginBottom: 0,
  },
});
