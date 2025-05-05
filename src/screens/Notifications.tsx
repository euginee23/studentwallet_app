import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification,
  deleteAllNotifications,
} from '../config/notificationService';
import {getUser} from '../utils/authStorage';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userId, setUserId] = useState<number | null>(null);

  const loadNotifications = useCallback(async () => {
    try {
      const user = await getUser();
      if (user?.user_id) {
        setUserId(user.user_id);
        const data = await fetchNotifications(user.user_id);
        setNotifications(data);
      }
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAsRead = async (id: number) => {
    if (!id) {
      return;
    }
    await markNotificationAsRead(id);
    loadNotifications();
  };

  const handleMarkAllAsRead = async () => {
    if (userId) {
      await markAllNotificationsAsRead(userId);
      loadNotifications();
    }
  };

  const handleDeleteNotification = async (id: number) => {
    if (!userId) {
      return;
    }
    await deleteNotification(id, userId);
    loadNotifications();
  };

  const handleDeleteAll = async () => {
    if (!userId) {
      return;
    }
    await deleteAllNotifications(userId);
    loadNotifications();
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          colors={['#4CAF50']}
        />
      }>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Budget Alerts & Reminders</Text>
        <View style={{flexDirection: 'row', gap: 10}}>
          <TouchableOpacity onPress={handleMarkAllAsRead}>
            <Text style={styles.markAllText}>Mark All Read</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={handleDeleteAll}>
            <Text style={[styles.markAllText, {color: '#E53935'}]}>
              Clear All
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4CAF50" />
      ) : notifications.length === 0 ? (
        <Text style={{textAlign: 'center', color: '#999'}}>
          No notifications yet.
        </Text>
      ) : (
        notifications.map(notif => (
          <View key={notif.notification_id} style={styles.alertCard}>
            <View style={styles.alertHeader}>
              <Text style={styles.alertTitle}>{notif.title}</Text>
              <TouchableOpacity
                onPress={() => handleDeleteNotification(notif.notification_id)}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.alertText}>{notif.message}</Text>
            <Text style={styles.timestamp}>
              {new Date(notif.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}{' '}
              at{' '}
              {new Date(notif.created_at).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </Text>

            {!notif.is_read && (
              <TouchableOpacity
                style={styles.markAsReadButton}
                onPress={() => handleMarkAsRead(notif.notification_id)}>
                <Text style={styles.markAsReadText}>Mark as Read</Text>
              </TouchableOpacity>
            )}
          </View>
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F9FB',
    minHeight: '100%',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2A38',
  },
  markAllText: {
    fontSize: 13,
    color: '#4CAF50',
    fontWeight: '600',
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: {width: 0, height: 3},
    shadowRadius: 5,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  closeText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#E53935',
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
  },
  alertText: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  markAsReadButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#4CAF50',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  markAsReadText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  timestamp: {
    fontSize: 12,
    color: '#888',
    marginTop: -4,
    marginBottom: 6,
  },
});
