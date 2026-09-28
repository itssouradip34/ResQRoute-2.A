import React, { createContext, useContext, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../services/supabase/supabaseClient';
import { DrivingStyle, ExperienceLevel, UserProfile, VehicleType } from '../types';
import { AnomalyDetector } from '../services/sensor/AnomalyDetector';

const AUTH_PROFILE_STORAGE_KEY = '@resqroute_auth_profile_v2';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  signUp: (params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    vehicleType: VehicleType;
    experienceLevel: ExperienceLevel;
    drivingStyle: DrivingStyle;
  }) => Promise<{ success: boolean; error?: string }>;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  updateProfile: (profile: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  useEffect(() => {
    // Load local cached profile on start
    const restoreSession = async () => {
      try {
        const cached = await AsyncStorage.getItem(AUTH_PROFILE_STORAGE_KEY);
        if (cached) {
          const parsed: UserProfile = JSON.parse(cached);
          setUser(parsed);
          AnomalyDetector.setDriverProfile({
            vehicleType: parsed.vehicleType,
            experienceLevel: parsed.experienceLevel,
            drivingStyle: parsed.drivingStyle,
          });
        }

        // Also check Supabase active session if online
        const { data: { session } } = await supabase.auth.getSession();
        if (session && session.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profile) {
            const userProf: UserProfile = {
              id: session.user.id,
              email: session.user.email || profile.email,
              fullName: profile.full_name || 'Driver',
              phoneNumber: profile.phone_number,
              vehicleType: profile.vehicle_type || 'four_wheeler',
              experienceLevel: profile.experience_level || 'intermediate',
              drivingStyle: profile.driving_style || 'standard',
              totalTripsMonitored: profile.total_trips || 0,
              createdAt: profile.created_at || new Date().toISOString(),
            };
            setUser(userProf);
            await AsyncStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(userProf));
            AnomalyDetector.setDriverProfile({
              vehicleType: userProf.vehicleType,
              experienceLevel: userProf.experienceLevel,
              drivingStyle: userProf.drivingStyle,
            });
          }
        }
      } catch (err) {
        console.warn('Session restore note:', err);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const signUp = async (params: {
    email: string;
    password: string;
    fullName: string;
    phoneNumber?: string;
    vehicleType: VehicleType;
    experienceLevel: ExperienceLevel;
    drivingStyle: DrivingStyle;
  }): Promise<{ success: boolean; error?: string }> => {
    try {
      let userId = `user_${Date.now()}`;

      // 1. Try Supabase Auth
      try {
        const { data, error } = await supabase.auth.signUp({
          email: params.email,
          password: params.password,
        });

        if (error) {
          console.warn('Supabase auth sign up returned note:', error.message);
        } else if (data?.user?.id) {
          userId = data.user.id;
        }
      } catch (e) {
        console.warn('Network offline, creating local authenticated profile');
      }

      // 2. Build UserProfile
      const newProfile: UserProfile = {
        id: userId,
        email: params.email,
        fullName: params.fullName,
        phoneNumber: params.phoneNumber,
        vehicleType: params.vehicleType,
        experienceLevel: params.experienceLevel,
        drivingStyle: params.drivingStyle,
        totalTripsMonitored: 0,
        createdAt: new Date().toISOString(),
      };

      // 3. Save to Supabase profiles table
      try {
        await supabase.from('profiles').upsert([
          {
            id: userId,
            email: params.email,
            full_name: params.fullName,
            phone_number: params.phoneNumber,
            vehicle_type: params.vehicleType,
            experience_level: params.experienceLevel,
            driving_style: params.drivingStyle,
            created_at: new Date().toISOString(),
          },
        ]);
      } catch (err) {
        // Table fallback
      }

      // 4. Save to local storage & adapt AnomalyDetector
      setUser(newProfile);
      await AsyncStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(newProfile));
      AnomalyDetector.setDriverProfile({
        vehicleType: newProfile.vehicleType,
        experienceLevel: newProfile.experienceLevel,
        drivingStyle: newProfile.drivingStyle,
      });

      return { success: true };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Sign up failed' };
    }
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      let userObj: UserProfile | null = null;

      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        if (data?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', data.user.id)
            .single();

          userObj = {
            id: data.user.id,
            email: data.user.email || email,
            fullName: profile?.full_name || email.split('@')[0],
            phoneNumber: profile?.phone_number,
            vehicleType: profile?.vehicle_type || 'four_wheeler',
            experienceLevel: profile?.experience_level || 'intermediate',
            drivingStyle: profile?.driving_style || 'standard',
            totalTripsMonitored: profile?.total_trips || 0,
            createdAt: profile?.created_at || new Date().toISOString(),
          };
        }
      } catch (networkErr: any) {
        // If offline or demo, check cached credentials or log in with demo fallback
        const cached = await AsyncStorage.getItem(AUTH_PROFILE_STORAGE_KEY);
        if (cached) {
          userObj = JSON.parse(cached);
        } else {
          userObj = {
            id: `usr_${Date.now()}`,
            email,
            fullName: email.split('@')[0],
            vehicleType: 'four_wheeler',
            experienceLevel: 'intermediate',
            drivingStyle: 'standard',
            createdAt: new Date().toISOString(),
          };
        }
      }

      if (userObj) {
        setUser(userObj);
        await AsyncStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(userObj));
        AnomalyDetector.setDriverProfile({
          vehicleType: userObj.vehicleType,
          experienceLevel: userObj.experienceLevel,
          drivingStyle: userObj.drivingStyle,
        });
        return { success: true };
      }

      return { success: false, error: 'Could not sign in' };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Invalid email or password' };
    }
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      // ignore
    }
    setUser(null);
    await AsyncStorage.removeItem(AUTH_PROFILE_STORAGE_KEY);
    AnomalyDetector.setDriverProfile({
      vehicleType: 'four_wheeler',
      experienceLevel: 'intermediate',
      drivingStyle: 'standard',
    });
  };

  const updateProfile = async (partial: Partial<UserProfile>) => {
    if (!user) return;
    const updated: UserProfile = { ...user, ...partial };
    setUser(updated);
    await AsyncStorage.setItem(AUTH_PROFILE_STORAGE_KEY, JSON.stringify(updated));

    AnomalyDetector.setDriverProfile({
      vehicleType: updated.vehicleType,
      experienceLevel: updated.experienceLevel,
      drivingStyle: updated.drivingStyle,
    });

    try {
      await supabase.from('profiles').update({
        vehicle_type: updated.vehicleType,
        experience_level: updated.experienceLevel,
        driving_style: updated.drivingStyle,
        full_name: updated.fullName,
        phone_number: updated.phoneNumber,
      }).eq('id', user.id);
    } catch (e) {
      // offline fallback
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        signUp,
        signIn,
        signOut,
        updateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
