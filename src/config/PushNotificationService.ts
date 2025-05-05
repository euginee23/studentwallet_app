import notifee, {
  AndroidImportance,
  TimestampTrigger,
  TriggerType,
  RepeatFrequency,
} from '@notifee/react-native';
import { createNotification } from '../config/notificationService';
import { getUser } from '../utils/authStorage';

// NOTIFICATION CHANNEL
export const configurePushNotifications = async () => {
  await notifee.requestPermission();

  await notifee.createChannel({
    id: 'default-channel-id',
    name: 'Default Channel',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
  });

  await scheduleDailyReminders();
};

// MULTIPLE DAILY REMINDERS
export const scheduleDailyReminders = async () => {
  const times = [6, 9, 12, 15, 18];

  for (const hour of times) {
    const now = new Date();
    const reminderTime = new Date();
    reminderTime.setHours(hour, 0, 0, 0);

    if (now > reminderTime) {
      reminderTime.setDate(reminderTime.getDate() + 1);
    }

    const trigger: TimestampTrigger = {
      type: TriggerType.TIMESTAMP,
      timestamp: reminderTime.getTime(),
      repeatFrequency: RepeatFrequency.DAILY,
      alarmManager: true,
    };

    try {
      await notifee.createTriggerNotification(
        {
          title: 'Track your expenses now!',
          body: 'Open StudentWallet and stay on top of your budget!',
          android: {
            channelId: 'default-channel-id',
            smallIcon: 'ic_launcher',
            pressAction: { id: 'default' },
          },
        },
        trigger
      );
      console.log(`Reminder scheduled at ${hour}:00`);
    } catch (err) {
      console.error(`Failed to schedule reminder for ${hour}:00`, err);
    }
  }
};

// LOCAL + DATABASE UNIFICATION
export const sendLocalNotification = async (title: string, body: string) => {
  await notifee.displayNotification({
    title,
    body,
    android: {
      channelId: 'default-channel-id',
      smallIcon: 'ic_launcher',
      sound: 'default',
      pressAction: {
        id: 'default',
      },
    },
  });

  try {
    const user = await getUser();
    if (user?.user_id) {
      await createNotification(user.user_id, title, body);
    }
  } catch (err) {
    console.error('Failed to save notification to DB:', err);
  }
};
