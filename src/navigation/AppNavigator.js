import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import AdminScreen from '../screens/AdminScreen';
import AdminUserDetailScreen from '../screens/AdminUserDetailScreen';
import CropCycleScreen from '../screens/CropCycleScreen';
import CropCyclesScreen from '../screens/CropCyclesScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ExpensesScreen from '../screens/ExpensesScreen';
import FarmsScreen from '../screens/FarmsScreen';
import HarvestScreen from '../screens/HarvestScreen';
import LoginScreen from '../screens/LoginScreen';
import LogActivityScreen from '../screens/LogActivityScreen';
import ProfileScreen from '../screens/ProfileScreen';
import RemindersScreen from '../screens/RemindersScreen';
import ReportsScreen from '../screens/ReportsScreen';
import SelectCropsScreen from '../screens/SelectCropsScreen';
import { colors } from '../theme/colors';
import { navigationRef } from './navigationRef';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Dashboard: 'home',
  Farms: 'leaf',
  CropCycles: 'repeat',
  Reminders: 'notifications',
  Reports: 'bar-chart',
  Profile: 'person-circle',
};

function makeTabBarIcon(routeName) {
  return function TabBarIcon({ color, size }) {
    return <Ionicons name={TAB_ICONS[routeName]} color={color} size={size} />;
  };
}

function HomeTabs() {
  const { strings } = useLanguage();
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.accentDark,
        tabBarInactiveTintColor: colors.mutedInk,
        tabBarIcon: makeTabBarIcon(route.name),
        // Devanagari labels (मराठी/हिंदी) run taller than Latin text at the same font size —
        // matras/conjuncts need more line-height, or their tops/bottoms clip against the tab bar
        // edges. The bar's own height/padding grows with the bottom safe-area inset too, so
        // labels don't sit under a phone's home-indicator area.
        tabBarLabelStyle: { fontSize: 11, lineHeight: 14 },
        tabBarStyle: {
          height: 70 + insets.bottom,
          paddingTop: 8,
          paddingBottom: Math.max(12, insets.bottom + 8),
        },
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ title: strings.common.navHome }} />
      <Tab.Screen name="Farms" component={FarmsScreen} options={{ title: strings.common.navFarms }} />
      <Tab.Screen name="CropCycles" component={CropCyclesScreen} options={{ title: strings.common.navCycles }} />
      <Tab.Screen name="Reminders" component={RemindersScreen} options={{ title: strings.reminders.title }} />
      <Tab.Screen name="Reports" component={ReportsScreen} options={{ title: strings.common.navReports }} />
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: strings.common.navProfile }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { token, user, loading: authLoading } = useAuth();
  const { loading: languageLoading } = useLanguage();

  if (authLoading || languageLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  const needsCropSelection = token && user && !user.hasCompletedCropSelection;

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {needsCropSelection ? (
          // A distinct route name (not "SelectCrops", which the main-app stack below also uses)
          // is required here — same route name in both branches means React Navigation just
          // keeps showing the already-focused screen when the branch swaps, instead of falling
          // back to the new branch's initial route. A different name makes it disappear from the
          // tree entirely on the swap, the same way "Login" does when `token` first appears.
          <Stack.Screen name="OnboardingCropSelection" component={SelectCropsScreen} initialParams={{ onboarding: true }} />
        ) : token ? (
          <>
            <Stack.Screen name="HomeTabs" component={HomeTabs} />
            <Stack.Screen name="CropCycle" component={CropCycleScreen} />
            <Stack.Screen name="Expenses" component={ExpensesScreen} />
            <Stack.Screen name="Harvest" component={HarvestScreen} />
            <Stack.Screen name="SelectCrops" component={SelectCropsScreen} />
            <Stack.Screen name="Admin" component={AdminScreen} />
            <Stack.Screen name="AdminUserDetail" component={AdminUserDetailScreen} />
            <Stack.Screen
              name="LogActivity"
              component={LogActivityScreen}
              options={{ presentation: 'modal', headerShown: false }}
            />
          </>
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
