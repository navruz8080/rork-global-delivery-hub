import React, { useCallback, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  Pressable,
  Switch,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { 
  ChevronRight, 
  MapPin, 
  CreditCard, 
  Heart, 
  Bell, 
  Globe, 
  HelpCircle,
  Shield,
  LogOut,
  Settings,
  Package,
  Mail,
  Lock,
  User,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import Colors from '@/constants/colors';
import { useApp } from '@/providers/AppProvider';
import Button from '@/components/Button';

interface MenuItemProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  onPress: () => void;
  showArrow?: boolean;
  rightElement?: React.ReactNode;
}

function MenuItem({ icon, title, subtitle, onPress, showArrow = true, rightElement }: MenuItemProps) {
  return (
    <Pressable style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuItemIcon}>{icon}</View>
      <View style={styles.menuItemContent}>
        <Text style={styles.menuItemTitle}>{title}</Text>
        {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
      </View>
      {rightElement || (showArrow && <ChevronRight size={20} color={Colors.light.textTertiary} />)}
    </Pressable>
  );
}

function AuthForm() {
  const { login, register, loginError, registerError, isLoggingIn, isRegistering } = useApp();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  const handleSubmit = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      if (isLogin) {
        await login(email, password);
      } else {
        await register({ email, password, firstName, lastName });
      }
    } catch (error) {
      console.log('Auth error:', error);
    }
  };

  const error = isLogin ? loginError : registerError;
  const isLoading = isLogin ? isLoggingIn : isRegistering;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.authContainer}
    >
      <ScrollView 
        contentContainerStyle={styles.authScrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.authHeader}>
          <View style={styles.authIconContainer}>
            <User size={40} color={Colors.light.secondary} />
          </View>
          <Text style={styles.authTitle}>
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </Text>
          <Text style={styles.authSubtitle}>
            {isLogin ? 'Sign in to continue shopping' : 'Join GlobalGo marketplace'}
          </Text>
        </View>

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {!isLogin && (
          <View style={styles.nameRow}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <User size={20} color={Colors.light.textTertiary} />
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
            <View style={[styles.inputContainer, { flex: 1 }]}>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={setLastName}
                autoCapitalize="words"
                placeholderTextColor={Colors.light.textTertiary}
              />
            </View>
          </View>
        )}

        <View style={styles.inputContainer}>
          <Mail size={20} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={Colors.light.textTertiary}
          />
        </View>

        <View style={styles.inputContainer}>
          <Lock size={20} color={Colors.light.textTertiary} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            placeholderTextColor={Colors.light.textTertiary}
          />
        </View>

        <Button
          title={isLogin ? 'Sign In' : 'Create Account'}
          onPress={handleSubmit}
          loading={isLoading}
          disabled={!email || !password || (!isLogin && (!firstName || !lastName))}
          style={styles.submitButton}
        />

        <View style={styles.switchContainer}>
          <Text style={styles.switchText}>
            {isLogin ? "Don't have an account?" : 'Already have an account?'}
          </Text>
          <Pressable onPress={() => setIsLogin(!isLogin)}>
            <Text style={styles.switchLink}>
              {isLogin ? 'Sign Up' : 'Sign In'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, setUser, orders, favorites, isAuthenticated, logout } = useApp();

  const activeOrders = orders.filter(o => 
    ['pending', 'confirmed', 'processing', 'shipped', 'in_transit', 'out_for_delivery'].includes(o.status)
  );

  const handleToggleNotifications = useCallback((value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setUser(prev => ({ ...prev, notificationsEnabled: value }));
  }, [setUser]);

  const handleLogout = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive', 
          onPress: () => {
            logout();
          }
        },
      ]
    );
  }, [logout]);

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <SafeAreaView edges={['top']} style={styles.safeArea}>
          <View style={styles.header}>
            <Text style={styles.title}>Profile</Text>
          </View>
        </SafeAreaView>
        <AuthForm />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
          <Pressable style={styles.settingsButton} onPress={() => router.push('/settings')}>
            <Settings size={22} color={Colors.light.text} />
          </Pressable>
        </View>
      </SafeAreaView>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          <Image 
            source={{ uri: user.avatar || 'https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=200' }} 
            style={styles.avatar}
            contentFit="cover"
          />
          <View style={styles.profileInfo}>
            <Text style={styles.userName}>{user.firstName} {user.lastName}</Text>
            <Text style={styles.userEmail}>{user.email}</Text>
          </View>
          <Pressable style={styles.editButton}>
            <Text style={styles.editButtonText}>Edit</Text>
          </Pressable>
        </View>

        <View style={styles.statsContainer}>
          <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/orders')}>
            <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
              <Package size={20} color="#EF4444" />
            </View>
            <Text style={styles.statValue}>{activeOrders.length}</Text>
            <Text style={styles.statLabel}>Active Orders</Text>
          </Pressable>
          <Pressable style={styles.statItem} onPress={() => router.push('/(tabs)/favorites')}>
            <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
              <Heart size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{favorites.length}</Text>
            <Text style={styles.statLabel}>Wishlist</Text>
          </Pressable>
          <Pressable style={styles.statItem} onPress={() => router.push('/addresses')}>
            <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
              <MapPin size={20} color="#10B981" />
            </View>
            <Text style={styles.statValue}>{user.addresses?.length || 0}</Text>
            <Text style={styles.statLabel}>Addresses</Text>
          </Pressable>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<MapPin size={20} color={Colors.light.secondary} />}
              title="Delivery Addresses"
              subtitle={`${user.addresses?.length || 0} saved addresses`}
              onPress={() => router.push('/addresses')}
            />
            <MenuItem
              icon={<CreditCard size={20} color={Colors.light.secondary} />}
              title="Payment Methods"
              subtitle="Manage your cards"
              onPress={() => router.push('/payment-methods')}
            />
            <MenuItem
              icon={<Heart size={20} color={Colors.light.secondary} />}
              title="Wishlist"
              subtitle={`${favorites.length} items saved`}
              onPress={() => router.push('/(tabs)/favorites')}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<Bell size={20} color={Colors.light.secondary} />}
              title="Notifications"
              onPress={() => {}}
              showArrow={false}
              rightElement={
                <Switch
                  value={user.notificationsEnabled}
                  onValueChange={handleToggleNotifications}
                  trackColor={{ false: Colors.light.border, true: Colors.light.secondary }}
                  thumbColor="#FFF"
                />
              }
            />
            <MenuItem
              icon={<Globe size={20} color={Colors.light.secondary} />}
              title="Language"
              subtitle="English"
              onPress={() => {}}
            />
          </View>
        </View>

        <View style={styles.menuSection}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.menuCard}>
            <MenuItem
              icon={<HelpCircle size={20} color={Colors.light.secondary} />}
              title="Help Center"
              onPress={() => router.push('/help')}
            />
            <MenuItem
              icon={<Shield size={20} color={Colors.light.secondary} />}
              title="Privacy Policy"
              onPress={() => {}}
            />
          </View>
        </View>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <LogOut size={20} color={Colors.light.error} />
          <Text style={styles.logoutText}>Sign Out</Text>
        </Pressable>

        <Text style={styles.version}>Version 1.0.0</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  safeArea: {
    backgroundColor: Colors.light.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.light.text,
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.surfaceSecondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 20,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  editButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: Colors.light.surfaceSecondary,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.light.textTertiary,
    textAlign: 'center',
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    marginBottom: 12,
    paddingLeft: 4,
  },
  menuCard: {
    backgroundColor: Colors.light.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  menuItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: `${Colors.light.secondary}10`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.text,
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: Colors.light.textTertiary,
    marginTop: 2,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
    marginTop: 8,
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
  },
  version: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.light.textTertiary,
    marginTop: 16,
  },
  authContainer: {
    flex: 1,
  },
  authScrollContent: {
    padding: 20,
    paddingTop: 40,
  },
  authHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  authIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.light.secondary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  authTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  authSubtitle: {
    fontSize: 15,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
  errorContainer: {
    backgroundColor: `${Colors.light.error}15`,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: Colors.light.error,
    fontSize: 14,
    textAlign: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  input: {
    flex: 1,
    height: 52,
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  submitButton: {
    marginTop: 8,
  },
  switchContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    gap: 6,
  },
  switchText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
  },
  switchLink: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.secondary,
  },
});
