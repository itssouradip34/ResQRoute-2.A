/**
 * Centralized Telematics & Multimodal Sensor-Fusion Configuration
 * ResQRoute 2.A
 */

export interface TelematicsThresholdConfig {
  // Impact and Crash Limits
  collisionAccelPeakG: number;
  collisionJerkMs3: number;
  collisionGyroRadS: number;
  collisionSpeedDropKmH: number;
  lowSpeedCollisionAccelG: number;

  // Rollover Dynamics
  rolloverSustainedGyroRadS: number;
  rolloverMultiAxisDispersionG: number;

  // Maneuvers and Dynamics
  hardBrakingDecelG: number;
  hardBrakingSpeedDropKmH: number;
  hardAccelerationG: number;
  sharpTurnLateralG: number;
  sharpTurnYawRadS: number;
  skidLateralG: number;
  skidYawRadS: number;

  // Road Anomalies (PMC9044339 Guidelines)
  potholeVerticalImpulseG: number;
  potholeDurationMaxMs: number;
  speedBreakerVerticalImpulseG: number;
  speedBreakerPitchRadS: number;
  roughRoadVerticalVarianceMin: number;
  roughRoadPeakCountMin: number;

  // False-Positive & Disagreement Thresholds
  stationarySpeedMaxKmH: number;
  stationaryHandShakeJerkMin: number;
  stationaryHandShakeGyroMin: number;
  phoneDropAccelMinG: number;
  phoneDropSpeedDropMaxKmH: number;
}

export const DEFAULT_TELEMATICS_CONFIG: TelematicsThresholdConfig = {
  // Impact and Crash Limits
  collisionAccelPeakG: 5.5,
  collisionJerkMs3: 25.0,
  collisionGyroRadS: 4.5,
  collisionSpeedDropKmH: 25.0,
  lowSpeedCollisionAccelG: 2.5,

  // Rollover Dynamics
  rolloverSustainedGyroRadS: 5.8,
  rolloverMultiAxisDispersionG: 4.0,

  // Maneuvers and Dynamics
  hardBrakingDecelG: 3.8, // m/s^2 or ~0.4g
  hardBrakingSpeedDropKmH: 18.0,
  hardAccelerationG: 3.2,
  sharpTurnLateralG: 3.5,
  sharpTurnYawRadS: 1.8,
  skidLateralG: 4.8,
  skidYawRadS: 2.6,

  // Road Anomalies
  potholeVerticalImpulseG: 2.2,
  potholeDurationMaxMs: 400,
  speedBreakerVerticalImpulseG: 1.8,
  speedBreakerPitchRadS: 1.6,
  roughRoadVerticalVarianceMin: 0.30,
  roughRoadPeakCountMin: 3,

  // False-Positive & Disagreement Thresholds
  stationarySpeedMaxKmH: 12.0,
  stationaryHandShakeJerkMin: 12.0,
  stationaryHandShakeGyroMin: 2.0,
  phoneDropAccelMinG: 5.0,
  phoneDropSpeedDropMaxKmH: 5.0,
};

export const FUSION_WEIGHTS = {
  WITH_AUDIO: {
    imu: 0.35,
    speed: 0.30,
    audio: 0.20,
    temporal: 0.15,
  },
  WITHOUT_AUDIO: {
    imu: 0.45,
    speed: 0.35,
    audio: 0.0,
    temporal: 0.20,
  },
};

export const TEMPORAL_WINDOW_CONFIG = {
  MAX_FRAMES: 50, // 5.0s at 10Hz
  SAMPLING_RATE_HZ: 10,
  PRE_EVENT_MS: 1800,
  DISTURBANCE_MS: 500,
  PEAK_MS: 300,
  RECOVERY_MS: 1200,
  POST_EVENT_MS: 1800,
};

export const INDIAN_DOMAIN_CONFIG = {
  // Pothole multiplier due to higher frequency of deep unpaved potholes
  potholeFrequencyWeight: 1.25,
  // Speed breaker geometric variation (unmarked rumblers vs speed tables)
  speedBreakerPitchTolerance: 1.15,
  // Two-wheeler lean angle tolerance (motorcycles naturally lean in traffic)
  motorcycleLeanToleranceRadS: 1.35,
  // Horn rejection threshold (horns have peak acoustic energy > 2.5kHz but zero IMU correlation)
  hornAcousticRejectionDb: -10.0,
};
