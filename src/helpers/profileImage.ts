import Config from 'react-native-config';

export const uploadProfileImage = async (userId: number, uri: string, type: string, name: string) => {
  const formData = new FormData();
  formData.append('image', {
    uri,
    type,
    name,
  });

  const response = await fetch(`${Config.API_BASE_URL}/api/profile-image/${userId}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {throw new Error(data.error || 'Upload failed');}
  return data;
};
