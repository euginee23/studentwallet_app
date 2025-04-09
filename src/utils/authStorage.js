import AsyncStorage from '@react-native-async-storage/async-storage';

export const getToken = async () => {
  return await AsyncStorage.getItem('token');
};

export const getUser = async () => {
  const userData = await AsyncStorage.getItem('user');
  return userData ? JSON.parse(userData) : null;
};

export const logout = async () => {
  await AsyncStorage.removeItem('token');
  await AsyncStorage.removeItem('user');
};
