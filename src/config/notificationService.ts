import Config from 'react-native-config';

const API_URL = Config.API_BASE_URL;

// CREATE NOTIF
export const createNotification = async (
  user_id: number,
  title: string,
  message: string,
) => {
  try {
    const response = await fetch(`${API_URL}/api/notifications`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({user_id, title, message}),
    });
    return await response.json();
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
};

// FETCH NOTIF FOR A USER
export const fetchNotifications = async (user_id: number) => {
  try {
    const response = await fetch(`${API_URL}/api/notifications/${user_id}`);
    const data = await response.json();
    return data.notifications || [];
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return [];
  }
};

// MARK SINGLE NOTIF AS READ
export const markNotificationAsRead = async (id: number) => {
  try {
    await fetch(`${API_URL}/api/notifications/${id}/read`, {
      method: 'PUT',
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
  }
};

// MARK ALL NOTIF AS READ
export const markAllNotificationsAsRead = async (user_id: number) => {
  try {
    await fetch(`${API_URL}/api/notifications/${user_id}/mark-all-read`, {
      method: 'PUT',
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
  }
};

// DELETE NOTIFICATION
export const deleteNotification = async (
  notification_id: number,
  user_id: number,
) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/${notification_id}/${user_id}`,
      {
        method: 'DELETE',
      },
    );

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error deleting notification:', error);
    return null;
  }
};

// DELETE ALL NOTIFICATIONS FOR USER
export const deleteAllNotifications = async (user_id: number) => {
  try {
    const response = await fetch(
      `${API_URL}/api/notifications/${user_id}`,
      {
        method: 'DELETE',
      },
    );
    return await response.json();
  } catch (error) {
    console.error('Error deleting all notifications:', error);
    return null;
  }
};
