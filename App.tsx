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
import AllowanceScreen from './src/screens/Allowance';

import BottomNavigation from './src/components/BottomNavigation';
import HeaderProfileButton from './src/components/HeaderProfile';
import {getUser, getToken} from './src/utils/authStorage';

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
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentScreen, setCurrentScreen] = useState('');
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const checkLoginStatus = async () => {
      const token = await getToken();
      const user = await getUser();
      setIsLoggedIn(!!token && !!user);
      setInitialRoute(token ? 'Home' : 'Welcome');
    };
    checkLoginStatus();
  }, []);

  useEffect(() => {
    const unsubscribe = navigationRef.addListener('state', async () => {
      const token = await getToken();
      const user = await getUser();
      setIsLoggedIn(!!token && !!user);

      const route = navigationRef.getCurrentRoute();
      if (route) {
        setCurrentScreen(route.name);
      }
    });

    return unsubscribe;
  }, [navigationRef]);

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
      <View style={styles.appContainer}>
        <NavigationContainer ref={navigationRef}>
          <View style={styles.navigatorWrapper}>
            <Stack.Navigator
              initialRouteName={initialRoute}
              screenOptions={({route}: {route: {name: string}}) => ({
                animation: 'none',
                headerRight: () =>
                  isLoggedIn &&
                  !['Welcome', 'Login', 'Register'].includes(route.name) ? (
                    <HeaderProfileButton />
                  ) : null,
              })}>
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
                  headerRight: () =>
                    isLoggedIn ? <HeaderProfileButton /> : null,
                  headerStyle: {backgroundColor: '#1E2A38'},
                  headerTitleAlign: 'left',
                  headerTintColor: '#fff',
                  headerBackVisible: false,
                }}
              />
              <Stack.Screen
                name="Allowance"
                component={AllowanceScreen}
                options={{
                  headerTitle: HeaderLogo,
                  headerStyle: {backgroundColor: '#1E2A38'},
                  headerTitleAlign: 'left',
                  headerTintColor: '#fff',
                  headerBackVisible: false,
                }}
              />
            </Stack.Navigator>
          </View>
        </NavigationContainer>

        {/* Bottom nav as part of the layout */}
        {isLoggedIn &&
          !['Welcome', 'Login', 'Register'].includes(currentScreen) && (
            <BottomNavigation navigationRef={navigationRef} />
          )}
      </View>
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
  appContainer: {
    flex: 1,
    flexDirection: 'column',
  },
  navigatorWrapper: {
    flex: 1,
  },
});

export default App;
