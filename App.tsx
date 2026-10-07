import React, { useEffect, useState } from 'react';
import {
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { StatusBar as ExpoStatusBar } from 'expo-status-bar';
import { SettingsProvider, useSettings } from './src/context/SettingsContext';
import { EmergencyProvider, useEmergency } from './src/context/EmergencyContext';
import { AuthProvider } from './src/context/AuthContext';
import { Header } from './src/components/Header';
import { CountdownModal } from './src/components/CountdownModal';
import { ManualSOSButton } from './src/components/ManualSOSButton';
import { AudioAlertPlayer } from './src/components/AudioAlertPlayer';
import { AuthModal } from './src/components/AuthModal';
import { ErrorBoundary } from './src/components/ErrorBoundary';
import { APP_TABS, TabType, getTabSubtitle } from './src/navigation/TabsConfig';
import { HomeScreen } from './src/screens/HomeScreen';
import { ServicesListScreen } from './src/screens/ServicesListScreen';
import { AIChatTriageScreen } from './src/screens/AIChatTriageScreen';
import { SensorLabScreen } from './src/screens/SensorLabScreen';
import { TrustedContactsScreen } from './src/screens/TrustedContactsScreen';
import { ForensicReportScreen } from './src/screens/ForensicReportScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SituationType } from './src/types';

const MainApp: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [initialChatSituation, setInitialChatSituation] = useState<SituationType | undefined>(
    undefined
  );
  const { settings } = useSettings();
  const { status } = useEmergency();

  // Siren plays for both the pre-confirmation countdown (auto-detected
  // incidents) and once an incident is fully active (manual SOS included),
  // and stops as soon as it's cancelled/resolved/back to idle.
  useEffect(() => {
    const shouldSound =
      (status === 'confirming' || status === 'active') && settings.enableAudioAlarm;

    if (shouldSound) {
      AudioAlertPlayer.startAlarm();
    } else {
      AudioAlertPlayer.stopAlarm();
    }

    return () => {
      AudioAlertPlayer.stopAlarm();
    };
  }, [status, settings.enableAudioAlarm]);

  const handleNavigateToChat = (situation?: SituationType) => {
    setInitialChatSituation(situation);
    setActiveTab('chat');
  };


  const renderActiveScreen = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeScreen
            onNavigateToServices={() => setActiveTab('services')}
            onNavigateToChat={handleNavigateToChat}
          />
        );
      case 'services':
        return <ServicesListScreen />;
      case 'chat':
        return <AIChatTriageScreen initialSituation={initialChatSituation} />;
      case 'forensics':
        return <ForensicReportScreen />;
      case 'sensor_lab':
        return <SensorLabScreen />;
      case 'contacts':
        return <TrustedContactsScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ExpoStatusBar style="light" />
      
      {/* Top Header */}
      <Header
        title="ResQRoute-A"
        subtitle={activeTab === 'home' ? undefined : getTabSubtitle(activeTab)}
      />

      {/* Screen Content */}
      <View style={styles.screenContainer}>{renderActiveScreen()}</View>

      {/* Persistent Manual SOS Floating Button on Home Tab */}
      {activeTab === 'home' && <ManualSOSButton />}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        {APP_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={styles.navItem}
              activeOpacity={0.7}
              onPress={() => {
                if (tab.id === 'chat') setInitialChatSituation(undefined);
                setActiveTab(tab.id);
              }}
            >
              <Icon
                size={20}
                color={isActive ? '#58A6FF' : '#8B949E'}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <Text
                style={[
                  styles.navLabel,
                  isActive && styles.navLabelActive,
                ]}
              >
                {settings.language === 'hi' ? tab.label_hi : tab.label_en}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Global Countdown Modal overlay */}
      <CountdownModal />
    </SafeAreaView>
  );
};

export default function App() {
  return (
    <ErrorBoundary>
      <SettingsProvider>
        <AuthProvider>
          <EmergencyProvider>
            <MainApp />
            <AuthModal />
          </EmergencyProvider>
        </AuthProvider>
      </SettingsProvider>
    </ErrorBoundary>
  );
}


const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0D1117',
    paddingTop: StatusBar.currentHeight || 0,
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#161B22',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 26 : 22,
    paddingHorizontal: 6,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    minWidth: 50,
  },
  navLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 3,
  },
  navLabelActive: {
    color: '#58A6FF',
    fontWeight: '800',
  },
});
