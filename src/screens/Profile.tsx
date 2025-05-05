import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
} from 'react-native';
import {getUser} from '../utils/authStorage';
import Icon from 'react-native-vector-icons/Ionicons';
import {launchImageLibrary} from 'react-native-image-picker';
import {uploadProfileImage} from '../helpers/profileImage';
import ChangePasswordModal from '../modals/ChangePasswordModal';
import UpdateVerificationModal from '../modals/UpdateVerificationModal';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [firstName, setFirstName] = useState('');
  const [middleName, setMiddleName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isLoginEditing, setIsLoginEditing] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageMeta, setImageMeta] = useState<{
    uri: string;
    type: string;
    fileName: string;
  } | null>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [originalUsername, setOriginalUsername] = useState('');
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [verifyModalVisible, setVerifyModalVisible] = useState(false);
  const [pendingUpdate, setPendingUpdate] = useState<any>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const localUser = await getUser();
        if (!localUser?.user_id) {
          return;
        }

        const response = await fetch(
          `${process.env.API_BASE_URL}/api/profile/${localUser.user_id}`,
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch profile data.');
        }

        setUser(result.user);
        setFirstName(result.user.first_name || '');
        setMiddleName(result.user.middle_name || '');
        setLastName(result.user.last_name || '');
        setEmail(result.user.email || '');
        setContactNumber(result.user.contact_number || '');
        setOriginalUsername(result.user.username || '');

        if (result.image) {
          setProfileImage(result.image);
        }
      } catch (err) {
        console.error('Profile fetch error:', err);
        Alert.alert('Failed to load profile');
      }
    };

    fetchUserData();
  }, []);

  const handleImageUpload = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        quality: 0.8,
      },
      response => {
        if (response.didCancel || response.errorCode) {
          return;
        }

        const asset = response.assets?.[0];
        if (asset?.uri && asset.type && asset.fileName) {
          setSelectedImage(asset.uri);
          setImageMeta({
            uri: asset.uri,
            type: asset.type,
            fileName: asset.fileName,
          });
        }
      },
    );
  };

  const executeUpdate = async (updatedFields: any) => {
    try {
      const response = await fetch(
        `${process.env.API_BASE_URL}/api/profile/${user.user_id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(updatedFields),
        },
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Update failed.');
      }

      Alert.alert('Profile updated successfully!');
      setIsEditing(false);
      setIsLoginEditing(false);
    } catch (err) {
      console.error('Update error:', err);
      Alert.alert('Failed to update profile.');
    } finally {
      setPendingUpdate(null);
    }
  };

  const handleUpdate = async () => {
    if (!user?.user_id) return;

    const updatedFields: any = {};

    if (firstName !== user.first_name) {
      updatedFields.first_name = firstName;
    }
    if (middleName !== user.middle_name) {
      updatedFields.middle_name = middleName;
    }
    if (lastName !== user.last_name) {
      updatedFields.last_name = lastName;
    }
    if (contactNumber !== user.contact_number) {
      updatedFields.contact_number = contactNumber;
    }

    const usernameChanged = user.username !== originalUsername;
    const emailChanged = email !== user.email;

    if (usernameChanged) updatedFields.username = user.username;
    if (emailChanged) updatedFields.email = email;

    if (Object.keys(updatedFields).length === 0) {
      Alert.alert('No changes to update.');
      setIsEditing(false);
      setIsLoginEditing(false);
      return;
    }

    if (usernameChanged || emailChanged) {
      setPendingUpdate(updatedFields);
      setVerifyModalVisible(true);
    } else {
      await executeUpdate(updatedFields);
    }
  };

  const handleChangePassword = () => {
    setPendingUpdate({type: 'password'});
    setVerifyModalVisible(true);
  };

  const handleVerified = async () => {
    setVerifyModalVisible(false);

    if (pendingUpdate?.type === 'password') {
      setPasswordModalVisible(true);
    } else if (pendingUpdate) {
      await executeUpdate(pendingUpdate);
    }

    setPendingUpdate(null);
  };

  const onPasswordSubmit = async (newPassword: string) => {
    try {
      const response = await fetch(
        `${process.env.API_BASE_URL}/api/profile/change-password/${user.user_id}`,
        {
          method: 'PUT',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({password: newPassword}),
        },
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || 'Failed to update password');
      }
      Alert.alert('Password updated successfully!');
    } catch (err) {
      console.error('Password update error:', err);
      Alert.alert('Failed to update password.');
    }
  };

  const handleCancel = () => {
    if (!user) {
      return;
    }
    setFirstName(user.first_name || '');
    setMiddleName(user.middle_name || '');
    setLastName(user.last_name || '');
    setEmail(user.email || '');
    setContactNumber(user.contact_number || '');
    setIsEditing(false);
  };

  const renderField = (
    label: string,
    value: string,
    onChange?: (val: string) => void,
    placeholder?: string,
  ) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      {isEditing ? (
        <TextInput
          value={value}
          onChangeText={onChange!}
          style={styles.input}
          placeholder={placeholder}
        />
      ) : (
        <View style={styles.readOnlyField}>
          <Text style={styles.valueText}>{value || '-'}</Text>
        </View>
      )}
    </View>
  );

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handleImageUpload}>
          <View style={styles.avatarContainer}>
            <Image
              source={
                selectedImage
                  ? {uri: selectedImage}
                  : profileImage
                  ? {uri: profileImage}
                  : require('../../assets/default-profile.png')
              }
              style={styles.avatar}
              resizeMode="cover"
            />
          </View>
        </TouchableOpacity>

        <Text style={styles.uploadHint}>Tap to choose</Text>

        {selectedImage && (
          <View style={styles.avatarActionGroup}>
            <TouchableOpacity
              style={styles.avatarSaveButton}
              onPress={async () => {
                if (!user || !imageMeta) {
                  return;
                }

                try {
                  await uploadProfileImage(
                    user.user_id,
                    imageMeta.uri,
                    imageMeta.type,
                    imageMeta.fileName,
                  );
                  Alert.alert('Profile image updated successfully!');
                  setProfileImage(selectedImage);
                  setSelectedImage(null);
                } catch (err) {
                  console.error(err);
                  Alert.alert('Failed to upload profile image.');
                }
              }}>
              <Text style={styles.avatarSaveText}>Save Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.avatarCancelButton}
              onPress={() => setSelectedImage(null)}>
              <Text style={styles.avatarCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={styles.nameText}>
          {firstName} {lastName}
        </Text>
        <Text style={styles.usernameText}>@{user?.username || 'username'}</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Personal Information</Text>
          {!isEditing && (
            <TouchableOpacity onPress={() => setIsEditing(true)}>
              <Icon name="create-outline" size={22} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        {renderField('First Name', firstName, setFirstName, 'Enter first name')}
        {renderField(
          'Middle Name',
          middleName,
          setMiddleName,
          'Enter middle name',
        )}
        {renderField('Last Name', lastName, setLastName, 'Enter last name')}
        {renderField('Email', email, setEmail, 'Enter email')}
        {renderField(
          'Contact Number',
          contactNumber,
          setContactNumber,
          'Enter contact number',
        )}

        {isEditing && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>Account Information</Text>
          {!isLoginEditing && (
            <TouchableOpacity onPress={() => setIsLoginEditing(true)}>
              <Icon name="create-outline" size={22} color="#333" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Username</Text>
          {isLoginEditing ? (
            <TextInput
              value={user?.username || ''}
              onChangeText={text =>
                setUser((prev: any) => ({...prev, username: text}))
              }
              editable={true}
              style={styles.input}
              placeholder="Enter username"
            />
          ) : (
            <View style={styles.readOnlyField}>
              <Text style={styles.valueText}>{user?.username || '-'}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={styles.passwordButton}
          onPress={handleChangePassword}>
          <Text style={styles.passwordText}>Change Password</Text>
        </TouchableOpacity>

        {isLoginEditing && (
          <View style={styles.buttonGroup}>
            <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
              <Text style={styles.buttonText}>Save</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setIsLoginEditing(false)}>
              <Text style={styles.buttonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <UpdateVerificationModal
        visible={verifyModalVisible}
        email={email}
        user_id={user?.user_id}
        onClose={() => setVerifyModalVisible(false)}
        onVerified={handleVerified}
      />

      <ChangePasswordModal
        visible={passwordModalVisible}
        onClose={() => setPasswordModalVisible(false)}
        onSubmit={onPasswordSubmit}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: '#f2f4f7',
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    borderRadius: 60,
    padding: 3,
    borderWidth: 2,
    borderColor: '#4caf50',
    backgroundColor: '#fff',
    elevation: 4,
  },
  nameText: {
    marginTop: 10,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
  },
  usernameText: {
    fontSize: 14,
    color: '#777',
    marginTop: 4,
  },
  tapText: {
    fontSize: 12,
    color: '#4caf50',
    marginTop: 6,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 18,
    marginBottom: 24,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e2a38',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    fontWeight: '500',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 14,
    backgroundColor: '#fff',
  },
  readOnlyField: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: '#f1f1f1',
    borderRadius: 8,
  },
  valueText: {
    fontSize: 14,
    color: '#333',
  },
  buttonGroup: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
  },
  saveButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginRight: 10,
  },
  cancelButton: {
    backgroundColor: '#c62828',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  passwordButton: {
    marginTop: 10,
    backgroundColor: '#1565c0',
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  passwordText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#4caf50',
    overflow: 'hidden',
    backgroundColor: '#eee',
    elevation: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
  },
  uploadHint: {
    marginTop: 10,
    fontSize: 12,
    color: '#4caf50',
    textAlign: 'center',
  },
  avatarActionGroup: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  avatarSaveButton: {
    backgroundColor: '#2e7d32',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },

  avatarSaveText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  avatarCancelButton: {
    backgroundColor: '#c62828',
    paddingVertical: 8,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  avatarCancelText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
