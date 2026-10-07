import React, { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Activity,
  AlertOctagon,
  CheckCircle,
  Compass,
  Gauge,
  Play,
  RotateCcw,
  Sliders,
  Zap,
  Mic,
  Volume2,
  ShieldAlert,
  Layers,
  AlertTriangle,
  ShieldCheck,
} from 'lucide-react-native';
import { SensorFrame, SensorHub } from '../services/sensor/SensorHub';
import { AnomalyDetector } from '../services/sensor/AnomalyDetector';
import { AudioCrashDetector, AcousticDetectionResult } from '../services/audio/AudioCrashDetector';
import {
  CarlaScenarioTemplates,
  ExecutableScenario,
} from '../scenarios/CarlaScenarioTemplates';
import { useEmergency } from '../context/EmergencyContext';
import { useSettings } from '../context/SettingsContext';
import { SensitivityLevel } from '../types';

export const SensorLabScreen: React.FC = () => {
  const { userLocation } = useEmergency();
  const { settings, updateSensitivity } = useSettings();

  const [currentFrame, setCurrentFrame] = useState<SensorFrame>({
    timestamp: Date.now(),
    accel: { x: 0, y: 0, z: 1, magnitude: 1, jerk: 0 },
    gyro: { x: 0, y: 0, z: 0, magnitude: 0 },
    speedKmH: 0,
  });

  const [activeSimulationName, setActiveSimulationName] = useState<string | null>(
    null
  );
  const [acousticResult, setAcousticResult] = useState<AcousticDetectionResult | null>(
    null
  );

  useEffect(() => {
    const unsub = SensorHub.subscribe((frame) => {
      setCurrentFrame(frame);
    });
    return () => unsub();
  }, []);

  const history = SensorHub.getHistory();
  const evaluation = AnomalyDetector.evaluateFrame(currentFrame, history);
  const thresholds = AnomalyDetector.getThresholds();

  // ----------------------------------------------------
  // REAL-LIFE KINEMATICS THRESHOLD SIMULATIONS
  // ----------------------------------------------------

  // Rule C: Both intensity change -> Accident
  const runRuleCAccidentSim = () => {
    setActiveSimulationName('Rule C: Severe Collision (Both Accel & Gyro)');
    SensorHub.injectSimulatedFrame(
      { x: 0.1, y: 0.2, z: 1.0, jerk: 2 },
      { x: 0.1, y: 0.1, z: 0.1 },
      85
    );

    setTimeout(() => {
      SensorHub.injectSimulatedFrame(
        { x: 6.2, y: -7.5, z: 9.8, jerk: 55 },
        { x: 7.2, y: 8.9, z: 6.1 }, // Violent Gyro Tumble
        0 // Crash to 0 km/h
      );
    }, 200);
  };

  // Rule A: Sudden drop in accelerometer and no gyro intensity break -> Obstacle faced
  const runRuleAObstacleSim = () => {
    setActiveSimulationName('Rule A: Obstacle Faced (Accel Drop, No Gyro Break)');
    SensorHub.injectSimulatedFrame(
      { x: 0.1, y: 0.2, z: 1.0, jerk: 1 },
      { x: 0.1, y: 0.1, z: 0.1 },
      80
    );

    setTimeout(() => {
      SensorHub.injectSimulatedFrame(
        { x: 0.5, y: -4.2, z: 1.8, jerk: 35 }, // Sharp deceleration jerk
        { x: 0.2, y: 0.3, z: 0.2 }, // No gyro intensity break (< 1.8 rad/s)
        12 // Speed drops by 68 km/h (Emergency braking / obstacle)
      );
    }, 200);
  };

  // Rule B: Accelerometer no intensity changes but gyro change obvious -> Heavy bump
  const runRuleBBumpSim = () => {
    setActiveSimulationName('Rule B: Heavy Bump (Steady Accel, Gyro Change Obvious)');
    // Steady speed 45 km/h, no sharp deceleration, but obvious chassis pitch/roll
    SensorHub.injectSimulatedFrame(
      { x: 0.2, y: 0.2, z: 2.8, jerk: 12 },
      { x: 3.5, y: 4.2, z: 1.8 }, // Obvious gyro deflection
      45 // Speed steady
    );
  };

  // Zero-Speed Stationary Hand Shake (v = 0 km/h) False Positive Filter Test
  const runStationaryShakeSim = () => {
    setActiveSimulationName('Zero-Speed Hand Shake (v = 0 km/h False Positive Test)');
    SensorHub.injectSimulatedFrame(
      { x: 3.8, y: -4.5, z: 2.2, jerk: 42 },
      { x: 5.8, y: 6.5, z: 4.5 },
      0 // Speed is 0 km/h (phone shaken in hand while stationary)
    );
  };

  // ----------------------------------------------------
  // SOUND OBSERVATION CRASH SIMULATIONS
  // ----------------------------------------------------
  const runAcousticCrashSim = () => {
    setActiveSimulationName('Sound Observation: Metal Crash & Glass Shatter');
    const result = AudioCrashDetector.simulateAcousticEvent('crash');
    setAcousticResult(result);
  };

  const runAcousticNormalSim = () => {
    setActiveSimulationName('Sound Observation: Normal Cabin Driving Audio');
    const result = AudioCrashDetector.simulateAcousticEvent('normal');
    setAcousticResult(result);
  };

  const runAcousticHornSim = () => {
    setActiveSimulationName('Sound Observation: Vehicle Horn Honk (Horn != Crash)');
    const result = AudioCrashDetector.simulateAcousticEvent('horn');
    setAcousticResult(result);
  };

  const runCarlaScenario = (sc: ExecutableScenario) => {
    setActiveSimulationName(`CARLA: ${sc.name}`);
    sc.frames.forEach((f, idx) => {
      setTimeout(() => {
        SensorHub.injectSimulatedFrame(
          { x: f.accel.x, y: f.accel.y, z: f.accel.z, jerk: f.accel.jerk },
          { x: f.gyro.x, y: f.gyro.y, z: f.gyro.z },
          f.speedKmH
        );
      }, idx * 100);
    });
    if (sc.acousticFrame) {
      const res = AudioCrashDetector.evaluateFrame(sc.acousticFrame);
      setAcousticResult(res);
    }
  };

  const handleResetSim = () => {
    setActiveSimulationName(null);
    SensorHub.resetSimulation();
    setAcousticResult(null);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Info Banner */}
      <View style={styles.headerBanner}>
        <Activity size={20} color="#58A6FF" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>
            {settings.language === 'hi'
              ? 'सेंसर लैब एवं सिमुलेशन स्टूडियो'
              : 'Sensor Lab & Simulation Studio'}
          </Text>
          <Text style={styles.headerDesc}>
            {settings.language === 'hi'
              ? 'दुर्घटना व ब्रेकडाउन का लाइव ऑन-डिवाइस मूल्यांकन'
              : 'Real-time on-device kinematic anomaly scoring'}
          </Text>
        </View>
      </View>

      {/* Live Anomaly Score Meter */}
      <View style={styles.meterCard}>
        <View style={styles.meterTopRow}>
          <Text style={styles.meterLabel}>LIVE ANOMALY SCORE</Text>
          <View
            style={[
              styles.statusBadge,
              evaluation.eventType === 'POSSIBLE_ACCIDENT'
                ? styles.badgeRed
                : evaluation.eventType === 'OBSTACLE_FACED'
                ? styles.badgeAmber
                : evaluation.eventType === 'HEAVY_BUMP'
                ? styles.badgeAmber
                : evaluation.eventType === 'PHONE_SHAKE'
                ? styles.badgeGray
                : evaluation.eventType === 'POSSIBLE_BREAKDOWN'
                ? styles.badgeAmber
                : styles.badgeGreen,
            ]}
          >
            <Text
              style={[
                styles.statusBadgeText,
                evaluation.eventType === 'POSSIBLE_ACCIDENT'
                  ? styles.textRed
                  : evaluation.eventType === 'OBSTACLE_FACED'
                  ? styles.textAmber
                  : evaluation.eventType === 'HEAVY_BUMP'
                  ? styles.textAmber
                  : evaluation.eventType === 'PHONE_SHAKE'
                  ? styles.textGray
                  : evaluation.eventType === 'POSSIBLE_BREAKDOWN'
                  ? styles.textAmber
                  : styles.textGreen,
              ]}
            >
              {evaluation.eventType}
            </Text>
          </View>
        </View>

        <Text style={styles.scoreNumber}>{evaluation.anomalyScore.toFixed(2)}</Text>
        <Text style={styles.scoreReason}>{evaluation.reasoning}</Text>

        {/* Meter Visual Bar */}
        <View style={styles.barTrack}>
          <View
            style={[
              styles.barFill,
              {
                width: `${Math.min(100, (evaluation.anomalyScore / 10) * 100)}%`,
                backgroundColor:
                  evaluation.eventType === 'POSSIBLE_ACCIDENT'
                    ? '#FF3B30'
                    : evaluation.eventType === 'OBSTACLE_FACED'
                    ? '#FFA500'
                    : evaluation.eventType === 'HEAVY_BUMP'
                    ? '#D29922'
                    : evaluation.eventType === 'PHONE_SHAKE'
                    ? '#8B949E'
                    : '#3FB950',
              },
            ]}
          />
        </View>

        {/* VZCrash Dataset Real-Life Thresholds */}
        <View style={styles.vzCrashThresholdsCard}>
          <Text style={styles.vzCrashHeaderTitle}>VZCrash Dataset Real-Life Thresholds:</Text>
          <View style={styles.thresholdItemRow}>
            <View style={[styles.rulePill, { backgroundColor: 'rgba(255, 165, 0, 0.15)', borderColor: '#FFA500' }]}>
              <Text style={[styles.rulePillText, { color: '#FFA500' }]}>Rule A: Obstacle</Text>
            </View>
            <Text style={styles.thresholdItemDesc}>
              Speed Drop ≥{thresholds.obstacleSpeedDropThreshold} km/h + Jerk ≥{thresholds.obstacleJerkThreshold} m/s³ (Gyro &lt;{(thresholds.gyroCrashThreshold * 0.45).toFixed(1)} rad/s)
            </Text>
          </View>

          <View style={styles.thresholdItemRow}>
            <View style={[styles.rulePill, { backgroundColor: 'rgba(210, 153, 34, 0.15)', borderColor: '#D29922' }]}>
              <Text style={[styles.rulePillText, { color: '#D29922' }]}>Rule B: Heavy Bump</Text>
            </View>
            <Text style={styles.thresholdItemDesc}>
              Speed Drop ≤{thresholds.bumpSpeedDropMax} km/h + Gyro ≥{thresholds.bumpGyroMin} rad/s (Suppressed)
            </Text>
          </View>

          <View style={styles.thresholdItemRow}>
            <View style={[styles.rulePill, { backgroundColor: 'rgba(248, 81, 73, 0.15)', borderColor: '#F85149' }]}>
              <Text style={[styles.rulePillText, { color: '#F85149' }]}>Rule C: Crash</Text>
            </View>
            <Text style={styles.thresholdItemDesc}>
              Gyro ≥{thresholds.gyroCrashThreshold} rad/s + Accel Jerk ≥{thresholds.accelJerkCrashThreshold} m/s³ (Score ≥{thresholds.crashAnomalyThreshold})
            </Text>
          </View>
        </View>
      </View>

      {/* Multimodal Research & Fusion Debug Panel */}
      <View style={styles.fusionDebugCard}>
        <View style={styles.fusionHeaderRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Layers size={18} color="#58A6FF" />
            <Text style={styles.fusionPanelTitle}>MULTIMODAL SENSOR-FUSION</Text>
          </View>
          <View
            style={[
              styles.severityBadge,
              evaluation.severity === 'CRITICAL'
                ? styles.badgeCrit
                : evaluation.severity === 'HIGH'
                ? styles.badgeHigh
                : evaluation.severity === 'MEDIUM'
                ? styles.badgeMed
                : styles.badgeLow,
            ]}
          >
            <Text
              style={[
                styles.severityText,
                evaluation.severity === 'CRITICAL'
                  ? styles.textCrit
                  : evaluation.severity === 'HIGH'
                  ? styles.textHigh
                  : evaluation.severity === 'MEDIUM'
                  ? styles.textMed
                  : styles.textLow,
              ]}
            >
              {evaluation.severity || 'LOW'} SEVERITY
            </Text>
          </View>
        </View>

        {/* 13-Class Taxonomy Classification */}
        <View style={styles.taxonomyRow}>
          <Text style={styles.taxonomyLabel}>Predicted Event Taxonomy:</Text>
          <View style={styles.taxonomyPill}>
            <Text style={styles.taxonomyValue}>
              {evaluation.taxonomyClass || 'NORMAL_DRIVING'}
            </Text>
          </View>
        </View>

        {/* Temporal Phase Tracker */}
        <View style={styles.temporalPhaseRow}>
          <Text style={styles.temporalPhaseLabel}>Temporal Collision Stage:</Text>
          <View style={styles.phasePill}>
            <Text style={styles.phasePillText}>
              {evaluation.temporalPhase || 'PRE_EVENT'}
            </Text>
          </View>
        </View>

        {/* Modality Evidence Gauges */}
        <View style={styles.evidenceSection}>
          <Text style={styles.evidenceTitle}>Modality Evidence Breakdown:</Text>
          <View style={styles.evidenceGrid}>
            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>IMU Energy</Text>
              <Text style={styles.evidenceVal}>
                {Math.round((evaluation.evidenceScores?.imuEvidence ?? 0) * 100)}%
              </Text>
              <View style={styles.evidenceBarTrack}>
                <View
                  style={[
                    styles.evidenceBarFill,
                    {
                      width: `${Math.round((evaluation.evidenceScores?.imuEvidence ?? 0) * 100)}%`,
                      backgroundColor: '#58A6FF',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>Speed Loss</Text>
              <Text style={styles.evidenceVal}>
                {Math.round((evaluation.evidenceScores?.speedEvidence ?? 0) * 100)}%
              </Text>
              <View style={styles.evidenceBarTrack}>
                <View
                  style={[
                    styles.evidenceBarFill,
                    {
                      width: `${Math.round((evaluation.evidenceScores?.speedEvidence ?? 0) * 100)}%`,
                      backgroundColor: '#E3B341',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>Audio Crash</Text>
              <Text style={styles.evidenceVal}>
                {evaluation.evidenceScores?.audioEvidence !== undefined
                  ? `${Math.round(evaluation.evidenceScores.audioEvidence * 100)}%`
                  : 'N/A'}
              </Text>
              <View style={styles.evidenceBarTrack}>
                <View
                  style={[
                    styles.evidenceBarFill,
                    {
                      width: `${Math.round((evaluation.evidenceScores?.audioEvidence ?? 0) * 100)}%`,
                      backgroundColor: '#F85149',
                    },
                  ]}
                />
              </View>
            </View>

            <View style={styles.evidenceItem}>
              <Text style={styles.evidenceLabel}>Fused Score</Text>
              <Text style={[styles.evidenceVal, { color: '#3FB950' }]}>
                {evaluation.evidenceScores?.normalizedScore !== undefined
                  ? `${(evaluation.evidenceScores.normalizedScore * 10).toFixed(1)}/10`
                  : `${evaluation.anomalyScore.toFixed(1)}/10`}
              </Text>
              <View style={styles.evidenceBarTrack}>
                <View
                  style={[
                    styles.evidenceBarFill,
                    {
                      width: `${Math.min(100, (evaluation.evidenceScores?.normalizedScore ?? 0) * 100)}%`,
                      backgroundColor: '#3FB950',
                    },
                  ]}
                />
              </View>
            </View>
          </View>
        </View>

        {/* Agreement / Disagreement Status */}
        {evaluation.disagreementReport?.hasDisagreement ? (
          <View style={styles.disagreementBox}>
            <AlertTriangle size={16} color="#FFA500" />
            <View style={{ flex: 1 }}>
              <Text style={styles.disagreementTitle}>SENSOR DISAGREEMENT DETECTED</Text>
              <Text style={styles.disagreementDesc}>
                {evaluation.disagreementReport.reason}
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.agreementBox}>
            <ShieldCheck size={16} color="#3FB950" />
            <Text style={styles.agreementText}>
              All sensor modalities are in physical agreement.
            </Text>
          </View>
        )}
      </View>

      {/* Live Kinematic Gauges */}
      <View style={styles.gaugesGrid}>
        {/* Gyro Gauge */}
        <View style={styles.gaugeCard}>
          <Gauge size={20} color="#FF6B6B" />
          <Text style={styles.gaugeTitle}>Gyro Turbulence</Text>
          <Text style={styles.gaugeValue}>
            {currentFrame.gyro.magnitude.toFixed(2)}
            <Text style={styles.gaugeUnit}> rad/s</Text>
          </Text>
          <Text style={styles.gaugeSub}>
            Threshold: {thresholds.gyroCrashThreshold}
          </Text>
        </View>

        {/* Accel Jerk Gauge */}
        <View style={styles.gaugeCard}>
          <Zap size={20} color="#E3B341" />
          <Text style={styles.gaugeTitle}>Accel Jerk</Text>
          <Text style={styles.gaugeValue}>
            {currentFrame.accel.jerk.toFixed(1)}
            <Text style={styles.gaugeUnit}> m/s³</Text>
          </Text>
          <Text style={styles.gaugeSub}>
            Peak: {currentFrame.accel.magnitude.toFixed(2)} g
          </Text>
        </View>

        {/* Speed Gauge */}
        <View style={styles.gaugeCard}>
          <Compass size={20} color="#58A6FF" />
          <Text style={styles.gaugeTitle}>GPS Speed</Text>
          <Text style={styles.gaugeValue}>
            {currentFrame.speedKmH.toFixed(1)}
            <Text style={styles.gaugeUnit}> km/h</Text>
          </Text>
          <Text style={styles.gaugeSub}>
            Drop: {evaluation.speedDropDelta.toFixed(1)} km/h
          </Text>
        </View>
      </View>

      {/* Sensitivity Tuning Selector */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {settings.language === 'hi'
            ? 'सेंसर संवेदनशीलता (Sensitivity)'
            : 'Sensor Sensitivity Level'}
        </Text>
      </View>

      <View style={styles.sensitivityRow}>
        {(['low', 'medium', 'high'] as SensitivityLevel[]).map((lvl) => {
          const isSelected = settings.sensorSensitivity === lvl;
          return (
            <TouchableOpacity
              key={lvl}
              style={[
                styles.sensitivityBtn,
                isSelected && styles.sensitivityBtnActive,
              ]}
              activeOpacity={0.75}
              onPress={() => updateSensitivity(lvl)}
            >
              <Text
                style={[
                  styles.sensitivityBtnText,
                  isSelected && styles.sensitivityBtnTextActive,
                ]}
              >
                {lvl.toUpperCase()}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Simulation Trigger Sandbox */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>
          {settings.language === 'hi'
            ? 'सिमुलेशन सैंडबॉक्स (परीक्षण)'
            : 'Simulation Sandbox Triggers'}
        </Text>
        <Text style={styles.sectionSubtitle}>
          {settings.language === 'hi'
            ? 'बिना वास्तविक खतरे के सेंसर लॉजिक और काउंटडाउन का परीक्षण करें'
            : 'Safely test accident, breakdown, and pothole detection logic'}
        </Text>
      </View>

      <View style={styles.simTriggersContainer}>
        {/* Scenario 1: Rule C - Both Intensity Change (Accident) */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runRuleCAccidentSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
            <AlertOctagon size={22} color="#FF3B30" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>1. Rule C: Both Intensity Change (Accident)</Text>
            <Text style={styles.simDesc}>
              85 km/h → 0 km/h shock + violent gyro roll. Triggers POSSIBLE_ACCIDENT.
            </Text>
          </View>
          <Play size={18} color="#FF3B30" />
        </TouchableOpacity>

        {/* Scenario 2: Rule A - Obstacle Faced */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runRuleAObstacleSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(255, 165, 0, 0.15)' }]}>
            <ShieldAlert size={22} color="#FFA500" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>2. Rule A: Obstacle Faced (No Gyro Break)</Text>
            <Text style={styles.simDesc}>
              Sharp 80 → 12 km/h brake/obstacle shock without vehicle roll. Triggers OBSTACLE_FACED.
            </Text>
          </View>
          <Play size={18} color="#FFA500" />
        </TouchableOpacity>

        {/* Scenario 3: Rule B - Heavy Bump */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runRuleBBumpSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(63, 185, 80, 0.15)' }]}>
            <CheckCircle size={22} color="#3FB950" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>3. Rule B: Heavy Bump (Steady Accel, Gyro Obvious)</Text>
            <Text style={styles.simDesc}>
              Steady 45 km/h + high gyro roll/pitch. Suppressed to HEAVY_BUMP (no false alarm).
            </Text>
          </View>
          <Play size={18} color="#3FB950" />
        </TouchableOpacity>

        {/* Scenario 4: Zero-Speed Hand Shake (False Positive Filter) */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runStationaryShakeSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(139, 148, 158, 0.15)' }]}>
            <Activity size={22} color="#8B949E" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>4. Zero-Speed Hand Shake (v = 0 km/h)</Text>
            <Text style={styles.simDesc}>
              Violent shaking while stationary (0 km/h). Suppressed to PHONE_SHAKE with zero false alarm SOS.
            </Text>
          </View>
          <Play size={18} color="#8B949E" />
        </TouchableOpacity>

        {/* Scenario 5: Acoustic Sound Observation - Crash */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runAcousticCrashSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(218, 54, 51, 0.15)' }]}>
            <Mic size={22} color="#F85149" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>5. Sound Observation: Crash Impact Audio</Text>
            <Text style={styles.simDesc}>
              Simulates high-energy crunch & glass shatter (MIVIA/NINA/DeepCrashzam).
            </Text>
          </View>
          <Play size={18} color="#F85149" />
        </TouchableOpacity>

        {/* Scenario 5: Acoustic Sound Observation - Normal */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runAcousticNormalSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(88, 166, 255, 0.15)' }]}>
            <Volume2 size={22} color="#58A6FF" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>5. Sound Observation: Normal Cabin Audio</Text>
            <Text style={styles.simDesc}>
              Normal vehicle engine hum & highway cruising audio (safe baseline).
            </Text>
          </View>
          <Play size={18} color="#58A6FF" />
        </TouchableOpacity>

        {/* Scenario 6: Sound Observation - Traffic Horn (horn != crash) */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={runAcousticHornSim}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(227, 179, 65, 0.15)' }]}>
            <Volume2 size={22} color="#E3B341" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>6. Sound Observation: Traffic Horn (Horn != Crash)</Text>
            <Text style={styles.simDesc}>
              Loud vehicle horn honking in Indian traffic. Suppressed as non-crash.
            </Text>
          </View>
          <Play size={18} color="#E3B341" />
        </TouchableOpacity>

        {/* Section Divider: CARLA & Indian Multimodal Scenarios */}
        <View style={{ marginVertical: 10, paddingHorizontal: 4 }}>
          <Text style={{ color: '#58A6FF', fontSize: 13, fontWeight: '800', letterSpacing: 0.5 }}>
            CARLA & INDIAN MULTIMODAL SCENARIO RUNNERS
          </Text>
        </View>

        {/* CARLA Scenario A: Head-On Collision */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.highSpeedHeadOn())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(255, 59, 48, 0.15)' }]}>
            <AlertOctagon size={22} color="#FF3B30" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: High-Speed Head-On Collision</Text>
            <Text style={styles.simDesc}>
              80 km/h → 0 km/h impact shock, violent decel + glass crunch. Triggers COLLISION (Critical).
            </Text>
          </View>
          <Play size={18} color="#FF3B30" />
        </TouchableOpacity>

        {/* CARLA Scenario B: Rollover & Inversion */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.rolloverCrash())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(248, 81, 73, 0.15)' }]}>
            <RotateCcw size={22} color="#F85149" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: High-Speed Rollover & Inversion</Text>
            <Text style={styles.simDesc}>
              Multi-axis tumble, sustained 11.5 rad/s angular spin, chassis inverted. Triggers SEVERE_CRASH.
            </Text>
          </View>
          <Play size={18} color="#F85149" />
        </TouchableOpacity>

        {/* CARLA Scenario C: Monsoon Two-Wheeler Skid */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.twoWheelerSkid())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(227, 179, 65, 0.15)' }]}>
            <Zap size={22} color="#E3B341" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Monsoon Two-Wheeler Skid</Text>
            <Text style={styles.simDesc}>
              Loss of tire traction on wet road: High lateral force + yaw spin. Triggers SKID (Medium).
            </Text>
          </View>
          <Play size={18} color="#E3B341" />
        </TouchableOpacity>

        {/* CARLA Scenario D: Evasive Stop / Near Miss */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.hardBrakingEvasive())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(255, 165, 0, 0.15)' }]}>
            <ShieldAlert size={22} color="#FFA500" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Evasive Emergency Stop (Near Miss)</Text>
            <Text style={styles.simDesc}>
              Pedestrian/cow sudden cut-in: 65 → 10 km/h emergency braking, level chassis. Triggers NEAR_MISS.
            </Text>
          </View>
          <Play size={18} color="#FFA500" />
        </TouchableOpacity>

        {/* CARLA Scenario E: Phone Dropped In Cabin (Disagreement Demo) */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.phoneDroppedInCabin())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(210, 153, 34, 0.15)' }]}>
            <AlertTriangle size={22} color="#D29922" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Phone Dropped In Cabin (Disagreement Demo)</Text>
            <Text style={styles.simDesc}>
              6.75g shock at steady 50 km/h cruise, no crash sound. Flagged SENSOR_DISAGREEMENT (SOS Suppressed).
            </Text>
          </View>
          <Play size={18} color="#D29922" />
        </TouchableOpacity>

        {/* CARLA Scenario F: Deep Pothole Hit */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.deepPotholeHit())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(63, 185, 80, 0.15)' }]}>
            <CheckCircle size={22} color="#3FB950" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Deep Monsoon Pothole Hit (40 km/h)</Text>
            <Text style={styles.simDesc}>
              2.6g isolated vertical depression, steady velocity. Triggers POTHOLE (Low severity).
            </Text>
          </View>
          <Play size={18} color="#3FB950" />
        </TouchableOpacity>

        {/* CARLA Scenario G: Speed Breaker Pass */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.speedBreakerPass())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(63, 185, 80, 0.15)' }]}>
            <CheckCircle size={22} color="#3FB950" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Speed Breaker Traversal</Text>
            <Text style={styles.simDesc}>
              Symmetric vertical impulse + pitch rebound, temporary dip. Triggers SPEED_BREAKER (Low severity).
            </Text>
          </View>
          <Play size={18} color="#3FB950" />
        </TouchableOpacity>

        {/* CARLA Scenario H: Rough Road Vibration */}
        <TouchableOpacity
          style={styles.simCard}
          activeOpacity={0.8}
          onPress={() => runCarlaScenario(CarlaScenarioTemplates.roughRoadVibration())}
        >
          <View style={[styles.simIconBox, { backgroundColor: 'rgba(88, 166, 255, 0.15)' }]}>
            <Activity size={22} color="#58A6FF" />
          </View>
          <View style={styles.simContent}>
            <Text style={styles.simName}>CARLA: Rough / Gravel Road Vibration</Text>
            <Text style={styles.simDesc}>
              Continuous vertical vibration variance & peak reversals (PMC9044339). Triggers ROUGH_ROAD.
            </Text>
          </View>
          <Play size={18} color="#58A6FF" />
        </TouchableOpacity>

        {/* Acoustic Result Display Card if tested */}
        {acousticResult && (
          <View style={styles.acousticResultCard}>
            <View style={styles.acousticResultHeader}>
              <Mic size={18} color={acousticResult.isCrashEvent ? '#FF4D4D' : '#3FB950'} />
              <Text style={styles.acousticResultTitle}>
                Acoustic Neural Classification: {acousticResult.predictedClass}
              </Text>
            </View>
            <Text style={styles.acousticResultDesc}>{acousticResult.reasoning}</Text>
            <View style={styles.acousticProbRow}>
              <Text style={styles.probPill}>
                Crash: {(acousticResult.probabilities.CRASH_IMPACT * 100).toFixed(0)}%
              </Text>
              <Text style={styles.probPill}>
                Skid: {(acousticResult.probabilities.TIRE_SKID_SCREECH * 100).toFixed(0)}%
              </Text>
              <Text style={styles.probPill}>
                Normal: {(acousticResult.probabilities.NORMAL_VEHICLE * 100).toFixed(0)}%
              </Text>
            </View>
          </View>
        )}

        {/* Reset Simulation */}
        <TouchableOpacity
          style={styles.resetSimBtn}
          activeOpacity={0.8}
          onPress={handleResetSim}
        >
          <RotateCcw size={18} color="#8B949E" />
          <Text style={styles.resetSimText}>Reset Live Sensors & Simulation</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  contentContainer: {
    paddingBottom: 40,
  },
  headerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 16,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    gap: 12,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  headerDesc: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
  },
  meterCard: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  meterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  meterLabel: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeRed: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: 'rgba(255, 59, 48, 0.4)',
  },
  badgeAmber: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: 'rgba(255, 149, 0, 0.4)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    borderColor: 'rgba(63, 185, 80, 0.4)',
  },
  badgeGray: {
    backgroundColor: 'rgba(139, 148, 158, 0.15)',
    borderColor: 'rgba(139, 148, 158, 0.4)',
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  textRed: { color: '#FF4D4D' },
  textAmber: { color: '#FFA500' },
  textGreen: { color: '#3FB950' },
  textGray: { color: '#8B949E' },
  scoreNumber: {
    color: '#FFFFFF',
    fontSize: 48,
    fontWeight: '900',
    fontVariant: ['tabular-nums'],
    marginVertical: 4,
  },
  scoreReason: {
    color: '#C9D1D9',
    fontSize: 13,
    marginBottom: 12,
  },
  barTrack: {
    height: 10,
    backgroundColor: '#21262D',
    borderRadius: 5,
    overflow: 'hidden',
    marginBottom: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 5,
  },
  vzCrashThresholdsCard: {
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  vzCrashHeaderTitle: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  thresholdItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  rulePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  rulePillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  thresholdItemDesc: {
    color: '#C9D1D9',
    fontSize: 11,
    flex: 1,
    lineHeight: 16,
  },
  thresholdRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  thresholdText: {
    color: '#6E7681',
    fontSize: 11,
    fontWeight: '600',
  },
  gaugesGrid: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 20,
  },
  gaugeCard: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
  },
  gaugeTitle: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 6,
  },
  gaugeValue: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginVertical: 2,
  },
  gaugeUnit: {
    fontSize: 11,
    color: '#8B949E',
    fontWeight: '600',
  },
  gaugeSub: {
    color: '#6E7681',
    fontSize: 10,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: '#8B949E',
    fontSize: 12,
    marginTop: 2,
  },
  sensitivityRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 10,
    marginBottom: 20,
  },
  sensitivityBtn: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sensitivityBtnActive: {
    backgroundColor: '#238636',
    borderColor: '#2EA043',
  },
  sensitivityBtnText: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '800',
  },
  sensitivityBtnTextActive: {
    color: '#FFFFFF',
  },
  simTriggersContainer: {
    paddingHorizontal: 16,
    gap: 10,
  },
  simCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    gap: 12,
  },
  simIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simContent: {
    flex: 1,
  },
  simName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  simDesc: {
    color: '#8B949E',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  resetSimBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#21262D',
    height: 44,
    borderRadius: 12,
    gap: 8,
    marginTop: 6,
  },
  resetSimText: {
    color: '#C9D1D9',
    fontSize: 13,
    fontWeight: '700',
  },
  acousticResultCard: {
    backgroundColor: '#0D1117',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#30363D',
    marginTop: 4,
  },
  acousticResultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  acousticResultTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  acousticResultDesc: {
    color: '#8B949E',
    fontSize: 11,
    lineHeight: 16,
    marginBottom: 10,
  },
  acousticProbRow: {
    flexDirection: 'row',
    gap: 8,
  },
  probPill: {
    backgroundColor: '#21262D',
    color: '#C9D1D9',
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fusionDebugCard: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 16,
    marginBottom: 16,
  },
  fusionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  fusionPanelTitle: {
    color: '#58A6FF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  badgeCrit: {
    backgroundColor: 'rgba(255, 59, 48, 0.15)',
    borderColor: '#FF3B30',
  },
  badgeHigh: {
    backgroundColor: 'rgba(255, 149, 0, 0.15)',
    borderColor: '#FF9500',
  },
  badgeMed: {
    backgroundColor: 'rgba(227, 179, 65, 0.15)',
    borderColor: '#E3B341',
  },
  badgeLow: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    borderColor: '#3FB950',
  },
  severityText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textCrit: { color: '#FF3B30' },
  textHigh: { color: '#FF9500' },
  textMed: { color: '#E3B341' },
  textLow: { color: '#3FB950' },
  taxonomyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    backgroundColor: '#0D1117',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  taxonomyLabel: {
    color: '#8B949E',
    fontSize: 12,
    fontWeight: '600',
  },
  taxonomyPill: {
    backgroundColor: '#21262D',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  taxonomyValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  temporalPhaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  temporalPhaseLabel: {
    color: '#8B949E',
    fontSize: 12,
  },
  phasePill: {
    backgroundColor: 'rgba(88, 166, 255, 0.12)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    borderColor: '#58A6FF',
    borderWidth: 1,
  },
  phasePillText: {
    color: '#58A6FF',
    fontSize: 11,
    fontWeight: '700',
  },
  evidenceSection: {
    marginBottom: 12,
  },
  evidenceTitle: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  evidenceGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  evidenceItem: {
    flex: 1,
    backgroundColor: '#0D1117',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#21262D',
  },
  evidenceLabel: {
    color: '#8B949E',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 2,
  },
  evidenceVal: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 4,
  },
  evidenceBarTrack: {
    height: 4,
    backgroundColor: '#21262D',
    borderRadius: 2,
    overflow: 'hidden',
  },
  evidenceBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  disagreementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.12)',
    borderColor: '#FFA500',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  disagreementTitle: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  disagreementDesc: {
    color: '#C9D1D9',
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  agreementBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(63, 185, 80, 0.08)',
    borderColor: 'rgba(63, 185, 80, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    gap: 8,
    marginTop: 4,
  },
  agreementText: {
    color: '#3FB950',
    fontSize: 11,
    fontWeight: '600',
  },
});
