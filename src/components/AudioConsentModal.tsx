import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
} from 'react-native';
import { Mic, ShieldCheck, Lock, CheckCircle2, X } from 'lucide-react-native';
import { useSettings } from '../context/SettingsContext';
import { AudioCrashDetector } from '../services/audio/AudioCrashDetector';

interface AudioConsentModalProps {
  visible: boolean;
  onClose: () => void;
  onConsentGranted: () => void;
}

export const AudioConsentModal: React.FC<AudioConsentModalProps> = ({
  visible,
  onClose,
  onConsentGranted,
}) => {
  const { settings, updateConsent } = useSettings();

  const handleGrantConsent = async () => {
    AudioCrashDetector.setConsentGranted(true);
    await AudioCrashDetector.startMonitoring();
    onConsentGranted();
    onClose();
  };

  const handleDecline = () => {
    AudioCrashDetector.setConsentGranted(false);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          {/* Header Icon */}
          <View style={styles.iconCircle}>
            <Mic size={32} color="#58A6FF" />
          </View>

          <Text style={styles.title}>
            {settings.language === 'hi'
              ? 'ध्वनि आधारित दुर्घटना पहचान अनुमति'
              : 'Acoustic Crash Detection Permission'}
          </Text>

          <Text style={styles.description}>
            {settings.language === 'hi'
              ? 'ResQRoute AI सड़क दुर्घटनाओं (टायर फिसलना, शीशा टूटना, धातु की टक्कर) को तुरंत पहचानने के लिए माइक्रोफोन ध्वनियों का ऑन-डिवाइस विश्लेषण कर सकता है।'
              : 'ResQRoute AI can monitor ambient sounds in real-time to detect catastrophic collision acoustics (tire skidding, glass shatter, metal impacts) and trigger SOS.'}
          </Text>

          {/* Privacy Badges */}
          <View style={styles.privacyBox}>
            <View style={styles.privacyItem}>
              <Lock size={16} color="#3FB950" />
              <Text style={styles.privacyText}>
                {settings.language === 'hi'
                  ? '100% ऑन-डिवाइस न्यूरल प्रोसेसिंग (कोई ऑडियो रिकॉर्ड नहीं होता)'
                  : '100% on-device neural processing — raw audio is never recorded.'}
              </Text>
            </View>
            <View style={styles.privacyItem}>
              <ShieldCheck size={16} color="#3FB950" />
              <Text style={styles.privacyText}>
                {settings.language === 'hi'
                  ? 'सर्वर पर कोई आवाज नहीं भेजी जाती — पूर्ण गोपनीयता सुरक्षा'
                  : 'Zero voice data transmitted to external servers.'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={styles.allowButton}
            activeOpacity={0.8}
            onPress={handleGrantConsent}
          >
            <CheckCircle2 size={18} color="#FFFFFF" />
            <Text style={styles.allowButtonText}>
              {settings.language === 'hi'
                ? 'अनुमति दें और सुरक्षा चालू करें'
                : 'Grant Permission & Enable'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.declineButton}
            activeOpacity={0.7}
            onPress={handleDecline}
          >
            <Text style={styles.declineButtonText}>
              {settings.language === 'hi' ? 'अभी नहीं (अस्वीकार)' : 'Decline / Not Now'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  container: {
    backgroundColor: '#161B22',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: '#30363D',
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(88, 166, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  privacyBox: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 14,
    width: '100%',
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyText: {
    color: '#C9D1D9',
    fontSize: 12,
    flex: 1,
    fontWeight: '500',
  },
  allowButton: {
    backgroundColor: '#238636',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    height: 48,
    borderRadius: 12,
    width: '100%',
    marginBottom: 12,
  },
  allowButtonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 15,
  },
  declineButton: {
    paddingVertical: 10,
    width: '100%',
    alignItems: 'center',
  },
  declineButtonText: {
    color: '#8B949E',
    fontSize: 13,
    fontWeight: '600',
  },
});
