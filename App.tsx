import React, {useEffect, useState} from 'react';
import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  StatusBar,
  Image,
  View,
  BackHandler,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import WelcomeScreen from './src/screens/Welcome';
import LoginScreen from './src/screens/Login';
import RegisterScreen from './src/screens/Register';
import HomeScreen from './src/screens/Home';
import * as authStorage from './src/utils/authStorage';

const Stack = createNativeStackNavigator();

function HeaderLogo() {
  return (
    <View style={{flexDirection: 'row', alignItems: 'center'}}>
      <Image
        source={require('./assets/cover.png')}
        style={{width: 140, height: 40, resizeMode: 'contain'}}
      />
    </View>
  );
}

function App(): React.JSX.Element {
  const [initialRoute, setInitialRoute] = useState<string | undefined>(
    undefined,
  );
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await authStorage.getToken();
      setInitialRoute(token ? 'Home' : 'Welcome');
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const onBackPress = (): boolean => {
      const currentRoute = navigationRef.getCurrentRoute()?.name;

      if (currentRoute === 'Home') {
        BackHandler.exitApp();
        return true;
      }

      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      onBackPress,
    );

    return () => backHandler.remove();
  }, [navigationRef]);

  if (!initialRoute) {
    return (
      <View style={styles.loaderContainer}>
        <Image
          source={require('./assets/cover.png')}
          style={{
            width: 160,
            height: 50,
            resizeMode: 'contain',
            marginBottom: 20,
          }}
        />
        <ActivityIndicator size="large" color="#1E2A38" />
      </View>
    );
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1E2A38" />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator initialRouteName={initialRoute}>
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {backgroundColor: '#1E2A38'},
              headerTitleAlign: 'left',
              headerBackVisible: false,
            }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {backgroundColor: '#1E2A38'},
              headerTitleAlign: 'left',
              headerBackVisible: true,
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Register"
            component={RegisterScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {backgroundColor: '#1E2A38'},
              headerTitleAlign: 'left',
              headerTintColor: '#fff',
            }}
          />
          <Stack.Screen
            name="Home"
            component={HomeScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {backgroundColor: '#1E2A38'},
              headerTitleAlign: 'left',
              headerTintColor: '#fff',
              headerBackVisible: false,
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

export default App;
