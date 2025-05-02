import notifee, { AndroidImportance } from '@notifee/react-native';

// Configure Notifee channels (Android only)
export const configurePushNotifications = async () => {
  await notifee.requestPermission(); // Ask for permission (required on Android 13+ and iOS)

  // Create Android channel with sound enabled
  const channelId = await notifee.createChannel({
    id: 'default-channel-id',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default', // <-- This enables the default notification sound
    vibration: true,
  });

  console.log('Notifee channel created:', channelId);
};

// Trigger local notification
export const sendLocalNotification = async (title: string, body: string) => {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default-channel-id',
      smallIcon: 'ic_launcher', // Make sure this exists in android/app/src/main/res/mipmap
      sound: 'default',         // <-- Ensure the notification uses sound
      pressAction: {
        id: 'default',
      },
    },
  });
};
