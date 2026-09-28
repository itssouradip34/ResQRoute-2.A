import React, { useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Bike,
  Car,
  Check,
  Lock,
  LogOut,
  Mail,
  Phone,
  ShieldCheck,
  Truck,
  User,
  X,
  Zap,
} from 'lucide-react-native';
import { useAuth } from '../context/AuthContext';
import { DrivingStyle, ExperienceLevel, VehicleType } from '../types';

export const AuthModal: React.FC = () => {
  const {
    user,
    isAuthenticated,
    isAuthModalOpen,
    closeAuthModal,
    signIn,
    signUp,
    signOut,
  } = useAuth();

  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [vehicleType, setVehicleType] = useState<VehicleType>('four_wheeler');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>('intermediate');
  const [drivingStyle, setDrivingStyle] = useState<DrivingStyle>('standard');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!email.trim() || !password.trim()) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setIsLoading(true);

    if (mode === 'login') {
      const res = await signIn(email.trim(), password);
      setIsLoading(false);
      if (res.success) {
        closeAuthModal();
      } else {
        setErrorMessage(res.error || 'Failed to sign in.');
      }
    } else {
      if (!fullName.trim()) {
        setIsLoading(false);
        setErrorMessage('Please provide your full name.');
        return;
      }

      const res = await signUp({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        phoneNumber: phoneNumber.trim() || undefined,
        vehicleType,
        experienceLevel,
        drivingStyle,
      });

      setIsLoading(false);
      if (res.success) {
        setSuccessMessage('Account created and driver profile calibrated!');
        setTimeout(() => closeAuthModal(), 1200);
      } else {
        setErrorMessage(res.error || 'Failed to create account.');
      }
    }
  };

  const handleSignOut = async () => {
    await signOut();
    closeAuthModal();
  };

  return (
    <Modal
      visible={isAuthModalOpen}
      animationType="slide"
      transparent
      onRequestClose={closeAuthModal}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <ShieldCheck size={20} color="#58A6FF" />
              <Text style={styles.modalTitle}>
                {isAuthenticated
                  ? 'Driver Profile'
                  : mode === 'login'
                  ? 'Sign In to ResQRoute'
                  : 'Register Driver Account'}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              activeOpacity={0.7}
              onPress={closeAuthModal}
            >
              <X size={20} color="#8B949E" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
            {/* If Already Logged In */}
            {isAuthenticated && user ? (
              <View style={styles.profileCard}>
                <View style={styles.avatarCircle}>
                  <Text style={styles.avatarLetter}>
                    {user.fullName ? user.fullName[0].toUpperCase() : 'U'}
                  </Text>
                </View>
                <Text style={styles.userName}>{user.fullName}</Text>
                <Text style={styles.userEmail}>{user.email}</Text>

                <View style={styles.profileDetailsBox}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Vehicle Category:</Text>
                    <Text style={styles.detailVal}>
                      {user.vehicleType === 'two_wheeler'
                        ? '🏍️ Two-Wheeler (Motorcycle)'
                        : user.vehicleType === 'commercial'
                        ? '🚛 Commercial Transport'
                        : '🚗 Four-Wheeler (Car/SUV)'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Experience Level:</Text>
                    <Text style={styles.detailVal}>
                      {user.experienceLevel === 'novice'
                        ? '🔰 Novice (< 2 yrs)'
                        : user.experienceLevel === 'expert'
                        ? '🥇 Expert (5+ yrs)'
                        : '🥈 Intermediate (2-5 yrs)'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Driving Style:</Text>
                    <Text style={styles.detailVal}>
                      {user.drivingStyle === 'highway_commuter'
                        ? '⚡ Highway Commuter'
                        : user.drivingStyle === 'cautious'
                        ? '🛡️ Cautious'
                        : '🧭 Standard'}
                    </Text>
                  </View>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailKey}>Forensic Sync:</Text>
                    <Text style={[styles.detailVal, { color: '#3FB950' }]}>
                      Active (Supabase Cloud)
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.signOutButton}
                  activeOpacity={0.8}
                  onPress={handleSignOut}
                >
                  <LogOut size={16} color="#FF6B6B" />
                  <Text style={styles.signOutButtonText}>Sign Out</Text>
                </TouchableOpacity>
              </View>
            ) : (
              /* Auth Form (Login or Signup) */
              <View>
                {/* Mode Switcher Tabs */}
                <View style={styles.modeTabs}>
                  <TouchableOpacity
                    style={[styles.modeTab, mode === 'login' && styles.modeTabActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setMode('login');
                      setErrorMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        mode === 'login' && styles.modeTabTextActive,
                      ]}
                    >
                      Sign In
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modeTab, mode === 'signup' && styles.modeTabActive]}
                    activeOpacity={0.8}
                    onPress={() => {
                      setMode('signup');
                      setErrorMessage(null);
                    }}
                  >
                    <Text
                      style={[
                        styles.modeTabText,
                        mode === 'signup' && styles.modeTabTextActive,
                      ]}
                    >
                      Sign Up
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Notifications */}
                {errorMessage && (
                  <View style={styles.errorBox}>
                    <Text style={styles.errorText}>{errorMessage}</Text>
                  </View>
                )}
                {successMessage && (
                  <View style={styles.successBox}>
                    <Text style={styles.successText}>{successMessage}</Text>
                  </View>
                )}

                {/* Full Name (Sign Up only) */}
                {mode === 'signup' && (
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Full Name</Text>
                    <View style={styles.inputField}>
                      <User size={16} color="#8B949E" />
                      <TextInput
                        style={styles.textInput}
                        placeholder="e.g. Souradip Ghosh"
                        placeholderTextColor="#6E7681"
                        value={fullName}
                        onChangeText={setFullName}
                      />
                    </View>
                  </View>
                )}

                {/* Email */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Email Address</Text>
                  <View style={styles.inputField}>
                    <Mail size={16} color="#8B949E" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="driver@example.com"
                      placeholderTextColor="#6E7681"
                      autoCapitalize="none"
                      keyboardType="email-address"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                {/* Password */}
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Password</Text>
                  <View style={styles.inputField}>
                    <Lock size={16} color="#8B949E" />
                    <TextInput
                      style={styles.textInput}
                      placeholder="••••••••"
                      placeholderTextColor="#6E7681"
                      secureTextEntry
                      value={password}
                      onChangeText={setPassword}
                    />
                  </View>
                </View>

                {/* Driving Profile Onboarding (Sign Up only) */}
                {mode === 'signup' && (
                  <View style={styles.onboardingSection}>
                    <Text style={styles.sectionHeaderTitle}>
                      Vehicle & Driving Calibration
                    </Text>
                    <Text style={styles.sectionSubDesc}>
                      Dynamically tunes VZCrash thresholds to your vehicle dynamics & riding habits.
                    </Text>

                    {/* Vehicle Type Selector */}
                    <Text style={styles.subLabel}>Primary Vehicle Type</Text>
                    <View style={styles.selectorGrid}>
                      {[
                        { id: 'four_wheeler', label: '🚗 Car / SUV', desc: 'Standard 4-wheeler' },
                        { id: 'two_wheeler', label: '🏍️ Bike / Scooter', desc: 'Lean angle adaptive' },
                        { id: 'commercial', label: '🚛 Commercial', desc: 'Heavy transport' },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.selectorCard,
                            vehicleType === item.id && styles.selectorCardActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setVehicleType(item.id as VehicleType)}
                        >
                          <Text
                            style={[
                              styles.selectorCardText,
                              vehicleType === item.id && styles.selectorCardTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>

                    {/* Experience Level */}
                    <Text style={styles.subLabel}>Driving / Riding Experience</Text>
                    <View style={styles.selectorGrid}>
                      {[
                        { id: 'novice', label: '🔰 Novice (< 2 yrs)' },
                        { id: 'intermediate', label: '🥈 Intermediate (2-5 yrs)' },
                        { id: 'expert', label: '🥇 Expert (5+ yrs)' },
                      ].map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          style={[
                            styles.selectorCard,
                            experienceLevel === item.id && styles.selectorCardActive,
                          ]}
                          activeOpacity={0.7}
                          onPress={() => setExperienceLevel(item.id as ExperienceLevel)}
                        >
                          <Text
                            style={[
                              styles.selectorCardText,
                              experienceLevel === item.id && styles.selectorCardTextActive,
                            ]}
                          >
                            {item.label}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}

                {/* Submit Button */}
                <TouchableOpacity
                  style={[styles.submitButton, isLoading && styles.submitButtonDisabled]}
                  activeOpacity={0.8}
                  disabled={isLoading}
                  onPress={handleSubmit}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text style={styles.submitButtonText}>
                      {mode === 'login' ? 'Sign In' : 'Create Calibrated Account'}
                    </Text>
                  )}
                </TouchableOpacity>

                {/* Continue as Guest */}
                <TouchableOpacity
                  style={styles.guestButton}
                  activeOpacity={0.7}
                  onPress={closeAuthModal}
                >
                  <Text style={styles.guestButtonText}>Continue in Guest Mode</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#161B22',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 24,
    borderColor: '#30363D',
    borderTopWidth: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  closeBtn: {
    padding: 4,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 30,
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
    borderColor: '#30363D',
    borderWidth: 1,
  },
  modeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: '#238636',
  },
  modeTabText: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '700',
  },
  modeTabTextActive: {
    color: '#FFFFFF',
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 44,
    gap: 10,
  },
  textInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  onboardingSection: {
    backgroundColor: 'rgba(88, 166, 255, 0.06)',
    borderColor: 'rgba(88, 166, 255, 0.25)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginVertical: 14,
  },
  sectionHeaderTitle: {
    color: '#58A6FF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  sectionSubDesc: {
    color: '#8B949E',
    fontSize: 11,
    marginBottom: 10,
    lineHeight: 16,
  },
  subLabel: {
    color: '#C9D1D9',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 6,
  },
  selectorGrid: {
    gap: 6,
  },
  selectorCard: {
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  selectorCardActive: {
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    borderColor: '#58A6FF',
  },
  selectorCardText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  selectorCardTextActive: {
    color: '#58A6FF',
    fontWeight: '800',
  },
  submitButton: {
    backgroundColor: '#238636',
    borderRadius: 10,
    height: 46,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  guestButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  guestButtonText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  errorBox: {
    backgroundColor: 'rgba(248, 81, 73, 0.15)',
    borderColor: '#F85149',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    color: '#FF7B72',
    fontSize: 12,
  },
  successBox: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    borderColor: '#3FB950',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  successText: {
    color: '#7EE787',
    fontSize: 12,
    fontWeight: '700',
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#1F6FEB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
  },
  userName: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  userEmail: {
    color: '#8B949E',
    fontSize: 13,
    marginBottom: 16,
  },
  profileDetailsBox: {
    width: '100%',
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 14,
    gap: 10,
    marginBottom: 18,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailKey: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  detailVal: {
    color: '#E6EDF3',
    fontSize: 12,
    fontWeight: '700',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(248, 81, 73, 0.12)',
    borderColor: 'rgba(248, 81, 73, 0.4)',
    borderWidth: 1,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  signOutButtonText: {
    color: '#FF7B72',
    fontSize: 13,
    fontWeight: '700',
  },
});
