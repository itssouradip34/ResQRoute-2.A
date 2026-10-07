import React, { Component, ErrorInfo, ReactNode } from 'react';
import {
  Linking,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { AlertTriangle, Phone, RefreshCw, ShieldAlert } from 'lucide-react-native';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ errorInfo });
    console.error('🚨 [ResQRoute ErrorBoundary caught critical error]:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleEmergencyCall = (number: string) => {
    Linking.openURL(`tel:${number}`).catch((err) => {
      console.warn(`Failed to dial ${number}:`, err);
    });
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <SafeAreaView style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Header Badge */}
            <View style={styles.badgeContainer}>
              <ShieldAlert size={48} color="#F85149" strokeWidth={2.5} />
              <Text style={styles.title}>Emergency Safe Mode</Text>
              <Text style={styles.subtitle}>
                A display error occurred, but ResQRoute's emergency hotline links remain active.
              </Text>
            </View>

            {/* Emergency Hotline Buttons */}
            <View style={styles.hotlineSection}>
              <Text style={styles.sectionHeader}>IMMEDIATE EMERGENCY DIAL</Text>

              <TouchableOpacity
                style={[styles.callBtn, styles.callBtn112]}
                activeOpacity={0.8}
                onPress={() => this.handleEmergencyCall('112')}
              >
                <Phone size={24} color="#FFFFFF" strokeWidth={2.5} />
                <View style={styles.btnTextWrapper}>
                  <Text style={styles.btnTitle}>Call 112</Text>
                  <Text style={styles.btnSubtitle}>National Emergency (Police, Fire, Medical)</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callBtn, styles.callBtn108]}
                activeOpacity={0.8}
                onPress={() => this.handleEmergencyCall('108')}
              >
                <Phone size={24} color="#FFFFFF" strokeWidth={2.5} />
                <View style={styles.btnTextWrapper}>
                  <Text style={styles.btnTitle}>Call 108</Text>
                  <Text style={styles.btnSubtitle}>National Ambulance & Trauma Response</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.callBtn, styles.callBtn1033]}
                activeOpacity={0.8}
                onPress={() => this.handleEmergencyCall('1033')}
              >
                <Phone size={24} color="#FFFFFF" strokeWidth={2.5} />
                <View style={styles.btnTextWrapper}>
                  <Text style={styles.btnTitle}>Call 1033</Text>
                  <Text style={styles.btnSubtitle}>NHAI Highway Helpline & Towing</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Restart Button */}
            <TouchableOpacity
              style={styles.retryButton}
              activeOpacity={0.8}
              onPress={this.handleReset}
            >
              <RefreshCw size={20} color="#FFFFFF" />
              <Text style={styles.retryButtonText}>Restart Application</Text>
            </TouchableOpacity>

            {/* Technical Diagnostics */}
            {this.state.error && (
              <View style={styles.debugBox}>
                <View style={styles.debugHeader}>
                  <AlertTriangle size={16} color="#D29922" />
                  <Text style={styles.debugTitle}>Technical Diagnostics</Text>
                </View>
                <Text style={styles.debugErrorText} numberOfLines={3}>
                  {this.state.error.toString()}
                </Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100%',
  },
  badgeContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    color: '#F85149',
    fontSize: 24,
    fontWeight: '800',
    marginTop: 12,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: '#8B949E',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 16,
    lineHeight: 20,
  },
  hotlineSection: {
    width: '100%',
    marginBottom: 24,
  },
  sectionHeader: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 12,
    textAlign: 'center',
  },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  callBtn112: {
    backgroundColor: '#DA3633',
  },
  callBtn108: {
    backgroundColor: '#D29922',
  },
  callBtn1033: {
    backgroundColor: '#1F6FEB',
  },
  btnTextWrapper: {
    marginLeft: 16,
    flex: 1,
  },
  btnTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  btnSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#238636',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 10,
    width: '100%',
    marginBottom: 24,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  debugBox: {
    width: '100%',
    backgroundColor: '#161B22',
    borderWidth: 1,
    borderColor: '#30363D',
    borderRadius: 8,
    padding: 12,
  },
  debugHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  debugTitle: {
    color: '#D29922',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  debugErrorText: {
    color: '#C9D1D9',
    fontSize: 11,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
});
