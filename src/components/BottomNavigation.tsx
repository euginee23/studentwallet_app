import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { NavigationContainerRefWithCurrent } from '@react-navigation/native';

const tabs = [
  { label: 'Dashboard', icon: 'home-outline' },
  { label: 'Allowance', icon: 'wallet-outline' },
  { label: 'Expenses', icon: 'list-outline' },
  { label: 'Set Goals', icon: 'flag-outline' },
  { label: 'Reports', icon: 'document-text-outline' },
];

interface Props {
  navigationRef: NavigationContainerRefWithCurrent<any>;
}

export default function BottomNavigation({ navigationRef }: Props) {
  const activeTab = navigationRef.current?.getCurrentRoute()?.name || '';

  const goTo = (screen: string) => {
    if (activeTab !== screen) {
      navigationRef.current?.navigate(screen as never);
    }
  };

  return (
    <View style={styles.navBar}>
      {tabs.map((item, index) => {
        const isActive = activeTab === item.label;
        return (
          <TouchableOpacity
            key={index}
            style={styles.navItem}
            onPress={() => goTo(item.label)}
          >
            <Icon
              name={item.icon}
              size={22}
              color={isActive ? '#6C5CE7' : '#999'}
              style={{ marginBottom: 2 }}
            />
            <Text style={[styles.navLabel, isActive && styles.activeLabel]}>
              {item.label}
            </Text>
            {isActive && <View style={styles.activeBar} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  navBar: {
    height: 70,
    backgroundColor: '#fff',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 0.5,
    borderTopColor: '#ddd',
    paddingBottom: 5,
    paddingTop: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    paddingBottom: 12,
    position: 'relative',
  },
  navLabel: {
    fontSize: 10,
    color: '#999',
  },
  activeLabel: {
    color: '#6C5CE7',
    fontWeight: 'bold',
  },
  activeBar: {
    position: 'absolute',
    top: '100%',
    marginTop: 6,
    height: 3,
    width: 24,
    borderRadius: 2,
    backgroundColor: '#6C5CE7',
    alignSelf: 'center',
  },
});
