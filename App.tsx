import React from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {StatusBar, Image, View} from 'react-native';
import WelcomeScreen from './src/screens/Welcome';
import LoginScreen from './src/screens/Login';
import RegisterScreen from './src/screens/Register';

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
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#1E2A38" />
      <NavigationContainer>
        <Stack.Navigator initialRouteName="Welcome">
          <Stack.Screen
            name="Welcome"
            component={WelcomeScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {
                backgroundColor: '#1E2A38',
              },
              headerTitleAlign: 'left',
              headerBackVisible: false,
            }}
          />
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{
              headerTitle: HeaderLogo,
              headerStyle: {
                backgroundColor: '#1E2A38',
              },
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
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default App;
