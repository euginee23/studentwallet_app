import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import { fetchNotifications } from '../config/notificationService';
import { getUser } from '../utils/authStorage';

// Define Notification type
interface Notification {
  notification_id: number;
  user_id: number;
  title: string;
  message: string;
  is_read: number;
  created_at: string;
}

export default function HeaderNotificationsButton() {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [unreadCount, setUnreadCount] = useState(0);

  const loadUnreadCount = async () => {
    try {
      const user = await getUser();
      if (user?.user_id) {
        const notifs: Notification[] = await fetchNotifications(user.user_id);
        const unread = notifs.filter(n => !n.is_read).length;
        setUnreadCount(unread);
      }
    } catch (error) {
      console.error('Error fetching unread notifications:', error);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadUnreadCount();
    }
  }, [isFocused]);

  const handlePress = () => {
    navigation.navigate('Notifications' as never);
  };

  return (
    <TouchableOpacity onPress={handlePress} style={{ marginRight: 12 }}>
      <View style={styles.iconWrapper}>
        <Icon name="notifications-outline" size={26} color="#fff" />
        {unreadCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{unreadCount}</Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  iconWrapper: {
    position: 'relative',
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E53935',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    paddingHorizontal: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});
