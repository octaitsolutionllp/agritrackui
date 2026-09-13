import React from 'react';
import { StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';

// Keeps screen content (headers, "+ Add" buttons, etc.) clear of the iOS notch/status bar
// and Android status bar — plain View/ScrollView don't account for safe-area insets on their own.
export default function Screen({ children, style }) {
  return <SafeAreaView edges={['top']} style={[styles.screen, style]}>{children}</SafeAreaView>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
});
