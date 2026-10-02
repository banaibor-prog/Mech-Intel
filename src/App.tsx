import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import BootSplash from 'react-native-bootsplash';
import { AuthProvider } from './context/AuthContext';
import { ModeProvider } from './context/ModeContext';
import { AppConfigProvider } from './context/AppConfigContext';
import RootNavigator from './navigation/RootNavigator';
import { Colors } from './constants/Colors';

function App(): React.JSX.Element {
  useEffect(() => {
    BootSplash.hide({ fade: true });
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      <SafeAreaProvider>
        <AuthProvider>
          <AppConfigProvider>
            <ModeProvider>
              <StatusBar barStyle="dark-content" />
              <RootNavigator />
            </ModeProvider>
          </AppConfigProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </View>
  );
}

export default App;
