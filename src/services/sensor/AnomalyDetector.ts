import {
  AnomalyDetectionResult,
  SensitivityLevel,
  SensorSnapshot,
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
  }

  /**
   * Evaluate rolling sensor frames using VZCrash neural network weights & 3 real-life kinematic rules:
   *   Rule A: Sudden drop in accelerometer and no gyro intensity break -> Obstacle faced
   *   Rule B: Accelerometer no intensity changes but gyro change obvious -> Heavy bump (suppressed)
   *   Rule C: Both intensity change -> Accident
   */
  public evaluateFrame(
    currentFrame: SensorFrame,
    history: SensorFrame[]
  ): AnomalyDetectionResult {
    const now = Date.now();
    const thresholds = this.getThresholds();

    // 1. Calculate Gyro Turbulence (Magnitude of rotational velocity rad/s)
    const gyroTurbulence = currentFrame.gyro.magnitude;

    // 2. Calculate Accelerometer Jerk (Instantaneous impact force derivative)
    const accelJerk = currentFrame.accel.jerk;

    // 3. Calculate Speed Drop Delta over sliding window (last ~1.5 - 2s)
    let speedBefore = currentFrame.speedKmH;
    if (history.length > 0) {
      const windowStartFrame = history[0];
      speedBefore = windowStartFrame.speedKmH;
    }
    const speedAfter = currentFrame.speedKmH;
    const speedDropDelta = Math.max(0, speedBefore - speedAfter);

    // 4. Calculate Peak Metrics for Snapshot
    let accelPeak = currentFrame.accel.magnitude;
    let gyroPeak = currentFrame.gyro.magnitude;
    history.forEach((f) => {
      if (f.accel.magnitude > accelPeak) accelPeak = f.accel.magnitude;
      if (f.gyro.magnitude > gyroPeak) gyroPeak = f.gyro.magnitude;
    });

    // 5. Compute Weighted Anomaly Score
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
      };
    }

    // =========================================================================
    // STATIONARY HAND-SHAKE FILTER (Zero-Speed T=0 False Positive Guard)
    // If phone is stationary (speed < 12 km/h before & after), shaking in hand
    // generates high jerk & gyro rotation without vehicular momentum or speed drop.
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
        };
      }
    }

    // =========================================================================
    // RULE C: BOTH INTENSITY CHANGE -> ACCIDENT
    // Sudden shock/jerk in accelerometer AND violent gyro tumble/rotation
    // =========================================================================
    const isBothIntensityCrash =
      (accelJerk >= thresholds.accelJerkCrashThreshold ||
        speedDropDelta >= thresholds.speedDropCrashThreshold ||
        anomalyScore >= thresholds.crashAnomalyThreshold) &&
      gyroTurbulence >= thresholds.gyroCrashThreshold;

    const isHighEnergyTumble =
      gyroTurbulence >= thresholds.gyroCrashThreshold * 1.35;

    if (isBothIntensityCrash || isHighEnergyTumble) {
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
      };
    }

    // =========================================================================
    // RULE A: SUDDEN DROP IN ACCELEROMETER AND NO GYRO BREAK -> OBSTACLE FACED
    // Sudden drop in accelerometer (high jerk/deceleration) with speed drop and chassis level (no gyro tumble)
    // =========================================================================
    const isObstacleFaced =
      accelJerk >= thresholds.obstacleJerkThreshold &&
      speedDropDelta >= thresholds.obstacleSpeedDropThreshold &&
      gyroTurbulence < thresholds.gyroCrashThreshold * 0.45;

    if (isObstacleFaced) {
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
      };
    }

    // =========================================================================
    // RULE B: ACCELEROMETER NO INTENSITY CHANGES BUT GYRO CHANGE OBVIOUS -> HEAVY BUMP
    // Speed maintained with high angular pitch/roll or bump (suppressed from emergency SOS)
    // =========================================================================
    const isHeavyBump =
      speedDropDelta <= thresholds.bumpSpeedDropMax &&
      gyroTurbulence >= thresholds.bumpGyroMin &&
      accelJerk < thresholds.accelJerkCrashThreshold;

    if (isHeavyBump) {
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
    };
  }
}

export const AnomalyDetector = new AnomalyDetectorService();
