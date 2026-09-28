import { DrivingStyle, ExperienceLevel, SensitivityLevel, VehicleType } from '../../types';
import { DetectionThresholds } from './AnomalyDetector';

export interface DriverProfile {
  vehicleType: VehicleType;
  experienceLevel: ExperienceLevel;
  drivingStyle: DrivingStyle;
}

export class PersonalizedThresholdAdapter {
  /**
   * Dynamically tune base VZCrash thresholds according to driver/rider vehicle and experience
   */
  public static adapt(
    base: DetectionThresholds,
    profile: DriverProfile
  ): DetectionThresholds {
    const tuned: DetectionThresholds = { ...base };

    // 1. Two-Wheeler (Motorcycle / Scooter) Adaptation
    if (profile.vehicleType === 'two_wheeler') {
      // Motorcycles naturally lean into turns (20-45 deg), generating high normal roll/yaw
      // We raise bumpGyroMin so routine cornering is not flagged as heavy bumps
      tuned.bumpGyroMin = Number((base.bumpGyroMin * 1.30).toFixed(2));
      // Tighter obstacle and crash speed drop because bike collisions at 20-30 km/h are severe
      tuned.obstacleSpeedDropThreshold = Math.max(16.0, base.obstacleSpeedDropThreshold - 4.0);
      tuned.speedDropCrashThreshold = Math.max(22.0, base.speedDropCrashThreshold - 4.0);
      tuned.accelJerkCrashThreshold = Math.max(18.0, base.accelJerkCrashThreshold - 3.0);
    } else if (profile.vehicleType === 'commercial') {
      // Heavy trucks & buses have higher inertia and slower rotational tumbling
      tuned.gyroCrashThreshold = Math.max(3.2, base.gyroCrashThreshold - 0.8);
      tuned.accelJerkCrashThreshold = base.accelJerkCrashThreshold + 5.0;
      tuned.speedDropCrashThreshold = base.speedDropCrashThreshold + 8.0;
    }

    // 2. Experience Level Adaptation
    if (profile.experienceLevel === 'novice') {
      // Novice drivers experience frequent stall-stops and jerky low-speed braking
      tuned.obstacleJerkThreshold = Number((base.obstacleJerkThreshold * 1.20).toFixed(1));
      tuned.potholeJerkMax = Number((base.potholeJerkMax * 1.25).toFixed(1));
    } else if (profile.experienceLevel === 'expert') {
      // Expert drivers drive smoothly; anomalies are more definitively external events
      tuned.obstacleJerkThreshold = Number((base.obstacleJerkThreshold * 0.90).toFixed(1));
    }

    // 3. Driving Style Adaptation
    if (profile.drivingStyle === 'highway_commuter') {
      // High speed cruising
      tuned.speedDropCrashThreshold = Math.max(20.0, base.speedDropCrashThreshold - 3.0);
    } else if (profile.drivingStyle === 'cautious') {
      // Lower speed driving, lower crash energy threshold
      tuned.crashAnomalyThreshold = Number((base.crashAnomalyThreshold * 0.92).toFixed(2));
    }

    return tuned;
  }
}
