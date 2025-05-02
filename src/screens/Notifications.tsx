import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { notifications as notificationsData } from '../data/notificationsData';
import { sendLocalNotification } from '../config/PushNotificationService';

export default function NotificationsScreen() {
  const [notifications, setNotifications] = useState(notificationsData);
  const [refreshing, setRefreshing] = useState(false);

  const markAsRead = (id: number) => {
    const updated = notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    );
    setNotifications(updated);
  };

  const markAllAsRead = () => {
    const updated = notifications.map(n => ({ ...n, read: true }));
    setNotifications(updated);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setNotifications([...notificationsData]);
      setRefreshing(false);
    }, 500);
  };

  const handleTestNotification = () => {
    sendLocalNotification('Test Notification', 'This is a local test alert.');
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={['#4CAF50']}
        />
      }
    >
      <View style={styles.headerRow}>
        <Text style={styles.title}>Budget Alerts & Reminders</Text>
        <TouchableOpacity onPress={markAllAsRead}>
          <Text style={styles.markAllText}>Mark All as Read</Text>
        </TouchableOpacity>
      </View>

      {/* 🔔 Test Notification Button */}
      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.testButtonText}>Send Test Notification</Text>
      </TouchableOpacity>

      {notifications.map((notif) => (
        <View key={notif.id} style={styles.alertCard}>
          <View style={styles.alertContent}>
            <Text style={styles.alertTitle}>{notif.title}</Text>
            <Text style={styles.alertText}>{notif.message}</Text>
          </View>

          {!notif.read && (
            <TouchableOpacity
              style={styles.markAsReadButton}
              onPress={() => markAsRead(notif.id)}
            >
              <Text style={styles.markAsReadText}>Mark as Read</Text>
            </TouchableOpacity>
          )}
        </View>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#F7F9FB',
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
  testButton: {
    backgroundColor: '#E0F2F1',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  testButtonText: {
    color: '#00796B',
    fontWeight: '600',
    fontSize: 14,
  },
  alertCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 5,
  },
  alertContent: {
    marginBottom: 10,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E2A38',
    marginBottom: 6,
  },
  alertText: {
    fontSize: 14,
    color: '#555',
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
});
