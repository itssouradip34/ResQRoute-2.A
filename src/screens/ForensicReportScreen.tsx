import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Linking,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Cloud,
  Compass,
  Copy,
  ExternalLink,
  FileText,
  Lock,
  MapPin,
  RefreshCw,
  Share2,
  Shield,
  ShieldAlert,
  Zap,
} from 'lucide-react-native';
import {
  ForensicBlackboxService,
  ForensicIncidentPacket,
} from '../services/forensics/ForensicBlackboxService';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';

export const ForensicReportScreen: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const { settings } = useSettings();

  const [packets, setPackets] = useState<ForensicIncidentPacket[]>([]);
  const [selectedPacket, setSelectedPacket] = useState<ForensicIncidentPacket | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const loadReports = async () => {
    setIsLoading(true);
    try {
      const data = await ForensicBlackboxService.fetchCloudForensics(user?.id);
      setPackets(data);
      if (data.length > 0 && !selectedPacket) {
        setSelectedPacket(data[0]);
      }
    } catch (e) {
      console.warn('Failed to load forensic reports:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [user?.id]);

  const handleSharePoliceReport = async (packet: ForensicIncidentPacket) => {
    const reportText = `
🚨 RESQROUTE AI 2.0 - OFFICIAL POLICE & INSURANCE FORENSIC CRASH DOSSIER
=============================================================
Incident ID: ${packet.incidentId}
Date & Time (UTC): ${packet.crashTimestamp}
Driver Name: ${packet.driverName || 'Registered Driver'}
Vehicle Category: ${packet.vehicleType.toUpperCase()}
Cryptographic Integrity Hash: ${packet.cryptographicHashSha256}

GPS LOCATION & JURISDICTION:
- Coordinates: ${packet.location.latitude.toFixed(6)}, ${packet.location.longitude.toFixed(6)}
- Address: ${packet.location.addressName || 'Near Highway / Road Network'}
- Maps Verification Link: https://maps.google.com/?q=${packet.location.latitude},${packet.location.longitude}

PRE-CRASH IMPACT KINEMATICS:
- Velocity Before Collision: ${packet.speedBeforeKmH} km/h
- Post-Collision Velocity: ${packet.speedAfterKmH} km/h
- Deceleration Delta (Δv): ${packet.speedDeltaKmH} km/h
- Peak Impact Force: ${packet.peakAccelG} g
- Peak Acceleration Jerk: ${packet.peakJerkMs3} m/s³
- Angular Tumbling Velocity: ${packet.peakGyroRadS} rad/s
- Classified Impact Vector: ${packet.estimatedImpactVector}

POLICE INVESTIGATION NOTE:
${packet.policeSummaryNote}
=============================================================
Validated on-device by ResQRoute AI Pure JSON Forward-Pass Neural Engine.
Tamper-proof Blackbox Cloud Sync: ${packet.isSyncedToCloud ? 'Confirmed (Supabase Cloud)' : 'Local Hardware Buffer'}
`.trim();

    try {
      await Share.share({
        message: reportText,
        title: `ResQRoute Forensic Crash Dossier - ${packet.incidentId}`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  return (
    <View style={styles.container}>
      {/* Top Banner */}
      <View style={styles.headerCard}>
        <View style={styles.headerLeft}>
          <ShieldAlert size={22} color="#58A6FF" />
          <View>
            <Text style={styles.headerTitle}>
              {settings.language === 'hi'
                ? 'फोरेंसिक ब्लैकबॉक्स (पुलिस रिपोर्ट)'
                : 'Forensic Blackbox & Police Dossier'}
            </Text>
            <Text style={styles.headerSub}>
              {settings.language === 'hi'
                ? 'दुर्घटना उपरांत क्लाउड सिंक रिकॉर्ड'
                : 'Tamper-proof post-accident cloud crash flight recorder'}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshBtn}
          activeOpacity={0.7}
          onPress={loadReports}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#58A6FF" />
          ) : (
            <RefreshCw size={16} color="#58A6FF" />
          )}
        </TouchableOpacity>
      </View>

      {packets.length === 0 ? (
        <View style={styles.emptyContainer}>
          <FileText size={48} color="#30363D" />
          <Text style={styles.emptyTitle}>No Forensic Records Found</Text>
          <Text style={styles.emptyDesc}>
            When a collision or severe kinematic anomaly occurs, high-frequency flight recorder telemetry is automatically sealed with SHA-256 and synced to the cloud for police investigation.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Packet Selector Pills if multiple */}
          {packets.length > 1 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.packetSelectorContent}>
              {packets.map((pkt, idx) => (
                <TouchableOpacity
                  key={pkt.id}
                  style={[
                    styles.packetPill,
                    selectedPacket?.id === pkt.id && styles.packetPillActive,
                  ]}
                  activeOpacity={0.75}
                  onPress={() => setSelectedPacket(pkt)}
                >
                  <Text
                    style={[
                      styles.packetPillText,
                      selectedPacket?.id === pkt.id && styles.packetPillTextActive,
                    ]}
                  >
                    Report #{idx + 1} ({new Date(pkt.crashTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {selectedPacket && (
            <View style={styles.dossierCard}>
              {/* Dossier Header & Cryptographic Seal */}
              <View style={styles.dossierTopBar}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dossierTitle}>CRASH INVESTIGATION REPORT</Text>
                  <Text style={styles.dossierSubId}>REF: {selectedPacket.incidentId}</Text>
                </View>

                <View style={styles.cloudBadge}>
                  <Cloud size={12} color="#3FB950" />
                  <Text style={styles.cloudBadgeText}>Cloud Synced</Text>
                </View>
              </View>

              {/* SHA-256 Tamper-Proof Seal */}
              <View style={styles.hashBox}>
                <View style={styles.hashHeader}>
                  <Lock size={12} color="#D2A8FF" />
                  <Text style={styles.hashTitle}>Cryptographic Chain-of-Custody Seal (SHA-256):</Text>
                </View>
                <Text style={styles.hashString}>{selectedPacket.cryptographicHashSha256}</Text>
              </View>

              {/* Driver & Time Metadata */}
              <View style={styles.metaGrid}>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Driver / User</Text>
                  <Text style={styles.metaValue}>{selectedPacket.driverName || 'Registered Driver'}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Vehicle Category</Text>
                  <Text style={styles.metaValue}>{selectedPacket.vehicleType.toUpperCase()}</Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Timestamp (UTC)</Text>
                  <Text style={styles.metaValue}>
                    {new Date(selectedPacket.crashTimestamp).toLocaleString()}
                  </Text>
                </View>
                <View style={styles.metaItem}>
                  <Text style={styles.metaLabel}>Impact Classification</Text>
                  <Text style={[styles.metaValue, { color: '#FF7B72' }]}>
                    {selectedPacket.estimatedImpactVector}
                  </Text>
                </View>
              </View>

              {/* Kinematic Impact Dynamics */}
              <Text style={styles.sectionHeader}>PRE-CRASH FLIGHT RECORDER TELEMETRY</Text>
              <View style={styles.kinematicsCard}>
                <View style={styles.kpiRow}>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Speed Before</Text>
                    <Text style={styles.kpiValue}>
                      {selectedPacket.speedBeforeKmH} <Text style={styles.kpiUnit}>km/h</Text>
                    </Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Speed at Impact</Text>
                    <Text style={styles.kpiValue}>
                      {selectedPacket.speedAfterKmH} <Text style={styles.kpiUnit}>km/h</Text>
                    </Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Deceleration (Δv)</Text>
                    <Text style={[styles.kpiValue, { color: '#FF7B72' }]}>
                      {selectedPacket.speedDeltaKmH} <Text style={styles.kpiUnit}>km/h</Text>
                    </Text>
                  </View>
                </View>

                <View style={styles.kpiRow}>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Peak G-Force</Text>
                    <Text style={styles.kpiValue}>
                      {selectedPacket.peakAccelG} <Text style={styles.kpiUnit}>g</Text>
                    </Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Impact Jerk</Text>
                    <Text style={styles.kpiValue}>
                      {selectedPacket.peakJerkMs3.toFixed(1)} <Text style={styles.kpiUnit}>m/s³</Text>
                    </Text>
                  </View>
                  <View style={styles.kpiBox}>
                    <Text style={styles.kpiLabel}>Gyro Tumbling</Text>
                    <Text style={styles.kpiValue}>
                      {selectedPacket.peakGyroRadS} <Text style={styles.kpiUnit}>rad/s</Text>
                    </Text>
                  </View>
                </View>
              </View>

              {/* Exact Location & Maps Link */}
              <Text style={styles.sectionHeader}>INCIDENT COORDINATES & JURISDICTION</Text>
              <View style={styles.locationBox}>
                <MapPin size={18} color="#58A6FF" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationTitle}>
                    {selectedPacket.location.addressName || 'Road Network GPS Fix'}
                  </Text>
                  <Text style={styles.locationCoords}>
                    Lat: {selectedPacket.location.latitude.toFixed(6)}, Lng: {selectedPacket.location.longitude.toFixed(6)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.mapsBtn}
                  activeOpacity={0.7}
                  onPress={() =>
                    Linking.openURL(
                      `https://maps.google.com/?q=${selectedPacket.location.latitude},${selectedPacket.location.longitude}`
                    )
                  }
                >
                  <ExternalLink size={14} color="#58A6FF" />
                </TouchableOpacity>
              </View>

              {/* Police Summary Note */}
              <Text style={styles.sectionHeader}>INVESTIGATOR SUMMARY NOTE</Text>
              <View style={styles.policeNoteBox}>
                <Text style={styles.policeNoteText}>{selectedPacket.policeSummaryNote}</Text>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                style={styles.shareButton}
                activeOpacity={0.8}
                onPress={() => handleSharePoliceReport(selectedPacket)}
              >
                <Share2 size={16} color="#FFFFFF" />
                <Text style={styles.shareButtonText}>Share / Export Dossier for Police & Insurance</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#161B22',
    borderBottomWidth: 1,
    borderBottomColor: '#21262D',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  headerSub: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyDesc: {
    color: '#8B949E',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  packetSelectorContent: {
    gap: 8,
    marginBottom: 16,
  },
  packetPill: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  packetPillActive: {
    backgroundColor: '#1F6FEB',
    borderColor: '#388BFD',
  },
  packetPillText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  packetPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  dossierCard: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 16,
  },
  dossierTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dossierTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  dossierSubId: {
    color: '#58A6FF',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
  cloudBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    borderColor: 'rgba(63, 185, 80, 0.4)',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  cloudBadgeText: {
    color: '#7EE787',
    fontSize: 10,
    fontWeight: '800',
  },
  hashBox: {
    backgroundColor: '#0D1117',
    borderColor: 'rgba(163, 113, 247, 0.3)',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginBottom: 14,
  },
  hashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  hashTitle: {
    color: '#D2A8FF',
    fontSize: 10,
    fontWeight: '700',
  },
  hashString: {
    color: '#8B949E',
    fontFamily: 'monospace',
    fontSize: 11,
  },
  metaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 12,
  },
  metaItem: {
    width: '47%',
  },
  metaLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  metaValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  sectionHeader: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 10,
    marginBottom: 8,
  },
  kinematicsCard: {
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  kpiRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  kpiBox: {
    flex: 1,
  },
  kpiLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
  },
  kpiValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  kpiUnit: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8B949E',
  },
  locationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 12,
  },
  locationTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  locationCoords: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
  },
  mapsBtn: {
    padding: 8,
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
    borderRadius: 8,
  },
  policeNoteBox: {
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  policeNoteText: {
    color: '#C9D1D9',
    fontSize: 12,
    lineHeight: 18,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#238636',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 4,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});
