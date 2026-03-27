import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Switch,
  Alert,
} from 'react-native';
import { Stack } from 'expo-router';
import { 
  ChevronRight, 
  Globe,
  DollarSign,
  Bell,
  Moon,
  Eye,
  Shield,
  Trash2,
  Info,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';

const languages = [
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Español' },
  { code: 'fr', name: 'Français' },
  { code: 'de', name: 'Deutsch' },
  { code: 'ru', name: 'Русский' },
  { code: 'zh', name: '中文' },
];

const currencies = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'RUB', symbol: '₽', name: 'Russian Ruble' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan' },
];

interface SettingItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon, title, subtitle, onPress, showArrow = true, rightElement, danger }: SettingItemProps) {
  return (
    <Pressable style={styles.settingItem} onPress={onPress} disabled={!onPress && !rightElement}>
      <View style={[styles.settingIcon, danger && styles.dangerIcon]}>{icon}</View>
      <View style={styles.settingContent}>
        <Text style={[styles.settingTitle, danger && styles.dangerText]}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && onPress && <ChevronRight size={20} color={Colors.light.textTertiary} />)}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { user, setUser } = useApp();
  const [darkMode, setDarkMode] = useState(false);

  const currentLanguage = languages.find(l => l.code === user.language) || languages[0];
  const currentCurrency = currencies.find(c => c.code === user.currency) || currencies[0];

  const handleToggle = useCallback((key: 'notifications' | 'darkMode', value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (key === 'notifications') {
      setUser(prev => ({ ...prev, notificationsEnabled: value }));
    } else {
      setDarkMode(value);
    }
  }, [setUser]);

  const handleLanguageSelect = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUser(prev => ({ ...prev, language: code }));
    Alert.alert('Language Updated', 'App will use the new language on next restart.');
  }, [setUser]);

  const handleCurrencySelect = useCallback((code: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUser(prev => ({ ...prev, currency: code }));
  }, [setUser]);

  const handleDeleteAccount = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => console.log('Account deleted') },
      ]
    );
  }, []);

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Settings' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Globe size={20} color={Colors.light.secondary} />}
              title="Language"
              subtitle={currentLanguage.name}
              onPress={() => Alert.alert(
                'Select Language',
                undefined,
                languages.map(lang => ({
                  text: lang.name,
                  onPress: () => handleLanguageSelect(lang.code),
                }))
              )}
            />
            <SettingItem
              icon={<DollarSign size={20} color={Colors.light.secondary} />}
              title="Currency"
              subtitle={`${currentCurrency.symbol} ${currentCurrency.name}`}
              onPress={() => Alert.alert(
                'Select Currency',
                undefined,
                currencies.map(curr => ({
                  text: `${curr.symbol} ${curr.name}`,
                  onPress: () => handleCurrencySelect(curr.code),
                }))
              )}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Bell size={20} color={Colors.light.secondary} />}
              title="Push Notifications"
              showArrow={false}
              rightElement={
                <Switch
                  value={user.notificationsEnabled}
                  onValueChange={(v) => handleToggle('notifications', v)}
                  trackColor={{ false: Colors.light.border, true: Colors.light.secondary }}
                  thumbColor="#FFF"
                />
              }
            />
            <SettingItem
              icon={<Moon size={20} color={Colors.light.secondary} />}
              title="Dark Mode"
              showArrow={false}
              rightElement={
                <Switch
                  value={darkMode}
                  onValueChange={(v) => handleToggle('darkMode', v)}
                  trackColor={{ false: Colors.light.border, true: Colors.light.secondary }}
                  thumbColor="#FFF"
                />
              }
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Privacy & Security</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Eye size={20} color={Colors.light.secondary} />}
              title="Privacy Settings"
              onPress={() => {}}
            />
            <SettingItem
              icon={<Shield size={20} color={Colors.light.secondary} />}
              title="Security"
              subtitle="Password, 2FA"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Info size={20} color={Colors.light.secondary} />}
              title="App Version"
              subtitle="1.0.0 (Build 1)"
              showArrow={false}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danger Zone</Text>
          <View style={styles.sectionCard}>
            <SettingItem
              icon={<Trash2 size={20} color={Colors.light.error} />}
              title="Delete Account"
              onPress={handleDeleteAccount}
              danger
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  sectionCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  settingIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  dangerIcon: {
    backgroundColor: `${Colors.light.error}10`,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  dangerText: {
    color: Colors.light.error,
  },
  settingSubtitle: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
});
