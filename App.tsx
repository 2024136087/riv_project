import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, NavigatorScreenParams } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import HomeScreen from './src/screens/HomeScreen';
import GenreScreen from './src/screens/GenreScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import MyPageScreen from './src/screens/MyPageScreen';
import BookDetailScreen from './src/screens/BookDetailScreen';
import LoginScreen from './src/screens/LoginScreen';
import SignUpScreen from './src/screens/SignUpScreen';
import ProfileEditScreen from './src/screens/ProfileEditScreen';
import GenreSelectScreen from './src/screens/GenreSelectScreen';
import WelcomeScreen from './src/screens/WelcomeScreen';
import PasswordChangeScreen from './src/screens/PasswordChangeScreen';
import { ThemeProvider, useColors, useTheme } from './src/contexts/ThemeContext';
import { Book } from './src/types';

export type RootStackParamList = {
  Main: NavigatorScreenParams<TabParamList> | undefined;
  BookDetail: { book: Book };
  Login: undefined;
  SignUp: undefined;
  ProfileEdit: undefined;
  GenreSelect: undefined;
  Welcome: { userName: string };
  PasswordChange: undefined;
};

export type TabParamList = {
  Home: undefined;
  Genre: undefined;
  Recommend: undefined;
  MyPage: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabParamList>();

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
  Home:      { active: 'home',          inactive: 'home-outline' },
  Genre:     { active: 'book',          inactive: 'book-outline' },
  Recommend: { active: 'sparkles',      inactive: 'sparkles-outline' },
  MyPage:    { active: 'person-circle', inactive: 'person-circle-outline' },
};

function MainTabs() {
  const Colors = useColors();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          const icons = TAB_ICONS[route.name];
          const iconName = focused ? icons.active : icons.inactive;
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.card,
          borderTopColor: Colors.border,
          height: 60,
          paddingBottom: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: '홈' }} />
      <Tab.Screen name="Genre" component={GenreScreen} options={{ title: '장르' }} />
      <Tab.Screen name="Recommend" component={RecommendScreen} options={{ title: 'AI추천' }} />
      <Tab.Screen name="MyPage" component={MyPageScreen} options={{ title: '마이페이지' }} />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const Colors = useColors();
  const { isDark } = useTheme();
  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack.Navigator>
        <Stack.Screen
          name="Main"
          component={MainTabs}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="BookDetail"
          component={BookDetailScreen}
          options={({ route }) => ({
            title: route.params.book.title,
            headerBackTitle: '뒤로',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.card },
            headerTitleStyle: { fontSize: 15, color: Colors.textPrimary },
          })}
        />
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="SignUp"
          component={SignUpScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="ProfileEdit"
          component={ProfileEditScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="GenreSelect"
          component={GenreSelectScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Welcome"
          component={WelcomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="PasswordChange"
          component={PasswordChangeScreen}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </ThemeProvider>
  );
}
