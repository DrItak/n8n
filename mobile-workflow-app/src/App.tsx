import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, StyleSheet } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screens
import HomeScreen from './screens/HomeScreen';
import WorkflowEditorScreen from './screens/WorkflowEditorScreen';
import WorkflowListScreen from './screens/WorkflowListScreen';
import SettingsScreen from './screens/SettingsScreen';
import AIAgentsScreen from './screens/AIAgentsScreen';

// Context
import { WorkflowProvider } from './context/WorkflowContext';
import { AIAgentProvider } from './context/AIAgentContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName: string;

        switch (route.name) {
          case 'Home':
            iconName = 'home';
            break;
          case 'Workflows':
            iconName = 'workflow';
            break;
          case 'AI Agents':
            iconName = 'robot';
            break;
          case 'Settings':
            iconName = 'cog';
            break;
          default:
            iconName = 'circle';
        }

        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: '#007AFF',
      tabBarInactiveTintColor: 'gray',
      tabBarStyle: {
        backgroundColor: '#FFFFFF',
        borderTopWidth: 1,
        borderTopColor: '#E5E5E5',
        paddingBottom: 5,
        paddingTop: 5,
        height: 60,
      },
      headerShown: false,
    })}
  >
    <Tab.Screen name="Home" component={HomeScreen} />
    <Tab.Screen name="Workflows" component={WorkflowListScreen} />
    <Tab.Screen name="AI Agents" component={AIAgentsScreen} />
    <Tab.Screen name="Settings" component={SettingsScreen} />
  </Tab.Navigator>
);

const App = () => {
  return (
    <SafeAreaProvider>
      <WorkflowProvider>
        <AIAgentProvider>
          <NavigationContainer>
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
            <Stack.Navigator
              screenOptions={{
                headerStyle: {
                  backgroundColor: '#FFFFFF',
                  shadowColor: 'transparent',
                },
                headerTintColor: '#007AFF',
                headerTitleStyle: {
                  fontWeight: '600',
                },
              }}
            >
              <Stack.Screen
                name="MainTabs"
                component={TabNavigator}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="WorkflowEditor"
                component={WorkflowEditorScreen}
                options={{
                  title: 'Workflow Editor',
                  presentation: 'modal',
                }}
              />
            </Stack.Navigator>
          </NavigationContainer>
        </AIAgentProvider>
      </WorkflowProvider>
    </SafeAreaProvider>
  );
};

export default App;