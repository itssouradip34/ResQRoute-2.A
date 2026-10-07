import {
  AnomalyDetectionResult,
  SensitivityLevel,
  SensorSnapshot,
  CrashTaxonomyClass,
  EventSeverity,
  TemporalPhase,
} from '../../types';
import { SensorFrame } from './SensorHub';
import {
  NeuralKinematicsClassifier,
  KinematicPrediction,
} from './NeuralKinematicsClassifier';
import {
  PersonalizedThresholdAdapter,
  DriverProfile,
} from './PersonalizedThresholdAdapter';
import { IMUFeatureExtractor } from './IMUFeatureExtractor';
import { SpeedFeatureExtractor } from './SpeedFeatureExtractor';
import { TemporalWindowManager } from './TemporalWindowManager';
import { MultimodalFusionEngine } from './MultimodalFusionEngine';
import { AudioCrashDetector } from '../audio/AudioCrashDetector';

export interface DetectionThresholds {
  crashAnomalyThreshold: number;
  mechanicalThreshold: number;
  gyroCrashThreshold: number;
  accelJerkCrashThreshold: number;
  speedDropCrashThreshold: number;
  speedDropBreakdownThreshold: number;
  obstacleJerkThreshold: number;
  obstacleSpeedDropThreshold: number;
  bumpGyroMin: number;
  bumpSpeedDropMax: number;
  potholeJerkMax: number;
}

const SENSITIVITY_PROFILES: Record<SensitivityLevel, DetectionThresholds> = {
  // Low Sensitivity: Resilient to very rough roads, potholes, speed breakers
  low: {
    crashAnomalyThreshold: 7.5,
    mechanicalThreshold: 3.5,
    gyroCrashThreshold: 6.5,
    accelJerkCrashThreshold: 30.0,
    speedDropCrashThreshold: 40.0,
    speedDropBreakdownThreshold: 25.0,
    obstacleJerkThreshold: 24.0,
    obstacleSpeedDropThreshold: 30.0,
    bumpGyroMin: 3.5,
    bumpSpeedDropMax: 6.0,
    potholeJerkMax: 18.0,
  },
  // Medium Sensitivity: Recommended balance for urban & highway driving in India
  medium: {
    crashAnomalyThreshold: 5.5,
    mechanicalThreshold: 2.8,
    gyroCrashThreshold: 4.5,
    accelJerkCrashThreshold: 22.0,
    speedDropCrashThreshold: 28.0,
    speedDropBreakdownThreshold: 18.0,
    obstacleJerkThreshold: 18.0,
    obstacleSpeedDropThreshold: 22.0,
    bumpGyroMin: 2.8,
    bumpSpeedDropMax: 5.0,
    potholeJerkMax: 14.0,
  },
  // High Sensitivity: Sensitive to low-speed bike skids, minor collisions, gentle rollovers
  high: {
    crashAnomalyThreshold: 3.8,
    mechanicalThreshold: 2.0,
    gyroCrashThreshold: 3.2,
    accelJerkCrashThreshold: 14.0,
    speedDropCrashThreshold: 18.0,
    speedDropBreakdownThreshold: 12.0,
    obstacleJerkThreshold: 14.0,
    obstacleSpeedDropThreshold: 15.0,
    bumpGyroMin: 2.2,
    bumpSpeedDropMax: 4.0,
    potholeJerkMax: 9.0,
  },
};

class AnomalyDetectorService {
  private sensitivity: SensitivityLevel = 'medium';
  private cooldownUntil = 0; // Prevent spamming triggers within cooldown window
  private driverProfile?: DriverProfile;
  private temporalWindowManager = new TemporalWindowManager();

  public setSensitivity(level: SensitivityLevel) {
    this.sensitivity = level;
  }

  public getSensitivity(): SensitivityLevel {
    return this.sensitivity;
  }

  public setDriverProfile(profile: DriverProfile) {
    this.driverProfile = profile;
  }

  public getDriverProfile(): DriverProfile | undefined {
    return this.driverProfile;
  }

  public getThresholds(): DetectionThresholds {
    const base = SENSITIVITY_PROFILES[this.sensitivity];
    if (this.driverProfile) {
      return PersonalizedThresholdAdapter.adapt(base, this.driverProfile);
    }
    return base;
  }

  public resetCooldown() {
    this.cooldownUntil = 0;
    this.temporalWindowManager.clear();
  }

  /**
   * Evaluate rolling sensor frames using Multimodal Sensor Fusion:
   * Combines IMU 3D projections, Speed Dynamics, Audio ML Classifier, and 5-stage Temporal windowing.
   */
  public evaluateFrame(
    currentFrame: SensorFrame,
    history: SensorFrame[]
  ): AnomalyDetectionResult {
    const now = Date.now();
    const thresholds = this.getThresholds();

    // Track frame in temporal window
    this.temporalWindowManager.addFrame(currentFrame);
    const temporalPhase = this.temporalWindowManager.evaluatePhase(currentFrame);

    // 1. Extract Multimodal Features
    const imuFeatures = IMUFeatureExtractor.extractFeatures(currentFrame, history);
    const speedFeatures = SpeedFeatureExtractor.extractFeatures(currentFrame, history);

    const gyroTurbulence = currentFrame.gyro.magnitude;
    const accelJerk = currentFrame.accel.jerk;
    const speedBefore = speedFeatures.speedBeforeKmH;
    const speedAfter = speedFeatures.speedAfterKmH;
    const speedDropDelta = speedFeatures.deltaVKmH;

    let accelPeak = currentFrame.accel.magnitude;
    let gyroPeak = currentFrame.gyro.magnitude;
    history.forEach((f) => {
      if (f.accel.magnitude > accelPeak) accelPeak = f.accel.magnitude;
      if (f.gyro.magnitude > gyroPeak) gyroPeak = f.gyro.magnitude;
    });

    // Compute Weighted Anomaly Score
    const normalizedGyro = gyroTurbulence;
    const normalizedJerk = accelJerk / 5.0;
    const normalizedSpeedDrop = speedDropDelta / 10.0;
    const anomalyScore = Number(
      (0.45 * normalizedGyro + 0.35 * normalizedJerk + 0.20 * normalizedSpeedDrop).toFixed(2)
    );

    const snapshot: SensorSnapshot = {
      accel_peak: Number(accelPeak.toFixed(2)),
      gyro_peak: Number(gyroPeak.toFixed(2)),
      speed_before: Number(speedBefore.toFixed(1)),
      speed_after: Number(speedAfter.toFixed(1)),
      raw_anomaly_score: anomalyScore,
      threshold_used: thresholds.crashAnomalyThreshold,
      captured_at: new Date().toISOString(),
    };

    // Forward pass via NeuralKinematicsClassifier (trained on VZCrash dataset)
    const neuralPrediction = NeuralKinematicsClassifier.predict({
      accelPeakG: accelPeak,
      accelJerk,
      speedDropDeltaKmH: speedDropDelta,
      gyroMagnitudeRadS: gyroTurbulence,
    });

    // Check Cooldown
    if (now < this.cooldownUntil) {
      return {
        eventType: 'NO_ANOMALY',
        confidenceScore: 0,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning: 'Within trigger cooldown window',
        taxonomyClass: 'NORMAL_DRIVING',
        severity: 'LOW',
        temporalPhase,
      };
    }

    // Query Audio Evidence
    const isAudioConsentGranted = AudioCrashDetector.getConsentGranted();
    const acousticEvidence = AudioCrashDetector.getLastAcousticEvidence();
    const acousticResult = AudioCrashDetector.getLastResult();
    const acousticClass = acousticResult?.predictedClass;

    // Run Multimodal Sensor-Fusion Engine
    const fusion = MultimodalFusionEngine.fuse({
      imu: imuFeatures,
      speed: speedFeatures,
      acousticEvidence,
      acousticClass,
      temporalPhase,
      isAudioConsentGranted,
    });

    // =========================================================================
    // STATIONARY HAND-SHAKE FILTER (Zero-Speed T=0 False Positive Guard)
    // =========================================================================
    const isStationary = speedBefore < 12 && speedAfter < 12;
    if (isStationary) {
      const isHandShaking =
        accelJerk > 12.0 || gyroTurbulence > 2.0 || currentFrame.accel.magnitude > 2.2;

      if (isHandShaking) {
        return {
          eventType: 'PHONE_SHAKE',
          confidenceScore: 0.05,
          anomalyScore,
          gyroTurbulence,
          accelJerk,
          speedDropDelta,
          snapshot,
          reasoning:
            'Stationary hand movement / phone shake detected at 0 km/h. False-positive SOS suppressed.',
          taxonomyClass: 'NORMAL_DRIVING',
          severity: 'LOW',
          evidenceScores: fusion.evidenceScores,
          disagreementReport: fusion.disagreementReport,
          temporalPhase,
          jerkMs3: accelJerk,
          speedDropPct: speedFeatures.percentageDrop,
        };
      }
    }

    // =========================================================================
    // RULE C: BOTH INTENSITY CHANGE -> ACCIDENT / COLLISION
    // =========================================================================
    const isBothIntensityCrash =
      (accelJerk >= thresholds.accelJerkCrashThreshold ||
        speedDropDelta >= thresholds.speedDropCrashThreshold ||
        anomalyScore >= thresholds.crashAnomalyThreshold) &&
      gyroTurbulence >= thresholds.gyroCrashThreshold;

    const isHighEnergyTumble =
      gyroTurbulence >= thresholds.gyroCrashThreshold * 1.35;

    if (isBothIntensityCrash || isHighEnergyTumble || fusion.taxonomyClass === 'COLLISION' || fusion.taxonomyClass === 'SEVERE_CRASH') {
      // Check for Phone Drop Disagreement before triggering crash
      if (fusion.taxonomyClass === 'SENSOR_DISAGREEMENT' && !fusion.requiresSOS) {
        return {
          eventType: 'NO_ANOMALY',
          confidenceScore: 0.1,
          anomalyScore,
          gyroTurbulence,
          accelJerk,
          speedDropDelta,
          snapshot,
          reasoning: fusion.reasoning,
          taxonomyClass: 'SENSOR_DISAGREEMENT',
          severity: 'LOW',
          evidenceScores: fusion.evidenceScores,
          disagreementReport: fusion.disagreementReport,
          temporalPhase,
          jerkMs3: accelJerk,
          speedDropPct: speedFeatures.percentageDrop,
        };
      }

      this.cooldownUntil = now + 12000;
      const confidence = Math.min(
        0.98,
        Math.max(0.70, (anomalyScore / thresholds.crashAnomalyThreshold) * 0.85)
      );

      return {
        eventType: 'POSSIBLE_ACCIDENT',
        confidenceScore: Number(confidence.toFixed(2)),
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning:
          'Rule C: Both accelerometer shock and violent gyro rotation changed simultaneously (High confidence accident)',
        taxonomyClass: fusion.taxonomyClass === 'SEVERE_CRASH' ? 'SEVERE_CRASH' : 'COLLISION',
        severity: 'CRITICAL',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // =========================================================================
    // RULE A: SUDDEN DROP IN ACCELEROMETER AND NO GYRO BREAK -> OBSTACLE FACED / NEAR MISS
    // =========================================================================
    const isObstacleFaced =
      accelJerk >= thresholds.obstacleJerkThreshold &&
      speedDropDelta >= thresholds.obstacleSpeedDropThreshold &&
      gyroTurbulence < thresholds.gyroCrashThreshold * 0.45;

    if (isObstacleFaced || fusion.taxonomyClass === 'NEAR_MISS') {
      this.cooldownUntil = now + 8000;
      const confidence = Math.min(
        0.94,
        Math.max(0.65, speedDropDelta / thresholds.obstacleSpeedDropThreshold)
      );

      return {
        eventType: 'OBSTACLE_FACED',
        confidenceScore: Number(confidence.toFixed(2)),
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning:
          'Rule A: Sudden drop in accelerometer with no gyro break (Obstacle faced / emergency braking)',
        taxonomyClass: 'NEAR_MISS',
        severity: 'HIGH',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // =========================================================================
    // RULE B: HEAVY BUMP / SPEED BREAKER (ACCEL STEADY, GYRO OBVIOUS)
    // =========================================================================
    const isHeavyBump =
      speedDropDelta <= thresholds.bumpSpeedDropMax &&
      gyroTurbulence >= thresholds.bumpGyroMin &&
      accelJerk < thresholds.accelJerkCrashThreshold;

    if (isHeavyBump || fusion.taxonomyClass === 'SPEED_BREAKER') {
      return {
        eventType: 'HEAVY_BUMP',
        confidenceScore: 0.15,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning:
          'Rule B: Accelerometer steady with obvious gyro deflection (Heavy bump / speed breaker suppressed)',
        taxonomyClass: 'SPEED_BREAKER',
        severity: 'LOW',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // Rotational Maneuvers (Skid / Sharp Turn)
    if (fusion.taxonomyClass === 'SKID') {
      return {
        eventType: 'NO_ANOMALY',
        confidenceScore: 0.25,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning: fusion.reasoning,
        taxonomyClass: 'SKID',
        severity: 'MEDIUM',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    if (fusion.taxonomyClass === 'SHARP_TURN') {
      return {
        eventType: 'NO_ANOMALY',
        confidenceScore: 0.1,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning: fusion.reasoning,
        taxonomyClass: 'SHARP_TURN',
        severity: 'MEDIUM',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // Pothole / Rough Road
    if (fusion.taxonomyClass === 'POTHOLE' || fusion.taxonomyClass === 'ROUGH_ROAD') {
      return {
        eventType: 'NO_ANOMALY',
        confidenceScore: 0.1,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning: fusion.reasoning,
        taxonomyClass: fusion.taxonomyClass,
        severity: 'LOW',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // Fallback Mechanical Drag / Breakdown
    if (speedDropDelta >= thresholds.speedDropBreakdownThreshold && gyroTurbulence < 1.5) {
      this.cooldownUntil = now + 8000;
      return {
        eventType: 'POSSIBLE_BREAKDOWN',
        confidenceScore: 0.72,
        anomalyScore,
        gyroTurbulence,
        accelJerk,
        speedDropDelta,
        snapshot,
        reasoning: 'Mechanical drag / tyre blowout deceleration detected',
        taxonomyClass: 'HARD_BRAKING',
        severity: 'MEDIUM',
        evidenceScores: fusion.evidenceScores,
        disagreementReport: fusion.disagreementReport,
        temporalPhase,
        jerkMs3: accelJerk,
        speedDropPct: speedFeatures.percentageDrop,
      };
    }

    // Default No Anomaly
    return {
      eventType: 'NO_ANOMALY',
      confidenceScore: 0,
      anomalyScore,
      gyroTurbulence,
      accelJerk,
      speedDropDelta,
      snapshot,
      reasoning: 'Normal motion within safe operational parameters',
      taxonomyClass: 'NORMAL_DRIVING',
      severity: 'LOW',
      evidenceScores: fusion.evidenceScores,
      disagreementReport: fusion.disagreementReport,
      temporalPhase,
      jerkMs3: accelJerk,
      speedDropPct: speedFeatures.percentageDrop,
    };
  }
}

export const AnomalyDetector = new AnomalyDetectorService();
