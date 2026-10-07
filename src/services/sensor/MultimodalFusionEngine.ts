/**
 * Multimodal Sensor-Fusion Engine
 * Combines IMU 3D projections, Speed Dynamics, Acoustic Classifier, and Temporal Phase.
 * Implements the ResQRoute Multimodal Decision Matrix, Sensor Disagreement Resolution,
 * and Severity Decoupling.
 */

import {
  CrashTaxonomyClass,
  EventSeverity,
  TemporalPhase,
  ModalityEvidenceScores,
  DisagreementReport,
  AnomalyDetectionResult,
  SensorSnapshot,
} from '../../types';
import { IMUFeatureSet } from './IMUFeatureExtractor';
import { SpeedFeatureSet } from './SpeedFeatureExtractor';
import {
  DEFAULT_TELEMATICS_CONFIG,
  FUSION_WEIGHTS,
  TelematicsThresholdConfig,
} from '../../config/telematicsConfig';

export interface FusionInput {
  imu: IMUFeatureSet;
  speed: SpeedFeatureSet;
  acousticEvidence?: number;
  acousticClass?: string;
  temporalPhase: TemporalPhase;
  thresholds?: TelematicsThresholdConfig;
  isAudioConsentGranted?: boolean;
}

export interface FusionOutput {
  taxonomyClass: CrashTaxonomyClass;
  severity: EventSeverity;
  confidenceScore: number;
  evidenceScores: ModalityEvidenceScores;
  disagreementReport: DisagreementReport;
  temporalPhase: TemporalPhase;
  requiresSOS: boolean;
  reasoning: string;
}

export class MultimodalFusionEngine {
  /**
   * Evaluates multimodal features and performs sensor fusion
   */
  public static fuse(input: FusionInput): FusionOutput {
    const thresh = input.thresholds || DEFAULT_TELEMATICS_CONFIG;
    const { imu, speed, temporalPhase } = input;
    const hasAudio = input.isAudioConsentGranted === true;
    const audioEv = hasAudio ? (input.acousticEvidence ?? 0) : 0;
    const audioClass = input.acousticClass || 'NORMAL_VEHICLE';

    // 1. Calculate Individual Modality Evidence Scores (0.0 to 1.0)
    // IMU Evidence: Normalized impact energy
    const imuEvScore = Math.min(
      1.0,
      Math.max(
        0.0,
        (imu.peakAccelWindow / thresh.collisionAccelPeakG) * 0.45 +
        (imu.peakJerkWindow / thresh.collisionJerkMs3) * 0.35 +
        (imu.peakGyroWindow / thresh.collisionGyroRadS) * 0.20
      )
    );

    // Speed Evidence: Normalized velocity loss
    const speedEvScore = Math.min(
      1.0,
      Math.max(
        0.0,
        (speed.deltaVKmH / thresh.collisionSpeedDropKmH) * 0.70 +
        (speed.percentageDrop / 100) * 0.30
      )
    );

    // Temporal Evidence: Disturbance/Peak alignment
    let temporalEvScore = 0.1;
    if (temporalPhase === 'PEAK') temporalEvScore = 0.95;
    else if (temporalPhase === 'DISTURBANCE') temporalEvScore = 0.65;
    else if (temporalPhase === 'RECOVERY') temporalEvScore = 0.50;
    else if (temporalPhase === 'POST_EVENT') temporalEvScore = 0.40;

    // Fused Score Calculation
    const weights = hasAudio ? FUSION_WEIGHTS.WITH_AUDIO : FUSION_WEIGHTS.WITHOUT_AUDIO;
    const normalizedScore = Number(
      (
        weights.imu * imuEvScore +
        weights.speed * speedEvScore +
        weights.audio * audioEv +
        weights.temporal * temporalEvScore
      ).toFixed(2)
    );

    const evidenceScores: ModalityEvidenceScores = {
      imuEvidence: Number(imuEvScore.toFixed(2)),
      speedEvidence: Number(speedEvScore.toFixed(2)),
      audioEvidence: hasAudio ? Number(audioEv.toFixed(2)) : undefined,
      temporalEvidence: Number(temporalEvScore.toFixed(2)),
      normalizedScore,
      weights,
    };

    let disagreementReport: DisagreementReport = {
      hasDisagreement: false,
      conflictingModalities: [],
      reason: 'Modalities are consistent',
    };

    // =========================================================================
    // SENSOR DISAGREEMENT CHECK 1: Phone Dropped in Cabin at Cruise Speed
    // Huge acceleration impulse, but speed steady (Delta V < 5) & no crash sound
    // =========================================================================
    const isExtremeIMUImpulse =
      imu.peakAccelWindow >= thresh.phoneDropAccelMinG ||
      imu.jerk >= thresh.collisionJerkMs3;
    const isSteadySpeed = speed.deltaVKmH <= thresh.phoneDropSpeedDropMaxKmH;
    const isNoCrashSound = audioEv < 0.40;

    if (isExtremeIMUImpulse && isSteadySpeed && speed.speedAfterKmH > 15.0 && isNoCrashSound) {
      disagreementReport = {
        hasDisagreement: true,
        conflictingModalities: ['IMU', 'SPEED', 'AUDIO'],
        reason:
          'Sharp IMU acceleration detected while GPS speed maintained steady without collision acoustic (Probable cabin phone drop).',
      };

      return {
        taxonomyClass: 'SENSOR_DISAGREEMENT',
        severity: 'LOW',
        confidenceScore: 0.91,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Sensor Disagreement: Accelerometer shock logged but cruise speed unchanged with no crash acoustic. Emergency dispatch suppressed.',
      };
    }

    // =========================================================================
    // SENSOR DISAGREEMENT CHECK 2: False Acoustic Alarm (Loud Horn/Noise)
    // Audio claims crash but IMU and Speed show zero disturbance
    // =========================================================================
    if (audioClass === 'HORN_TRAFFIC' || (audioEv >= 0.70 && imu.accelMag < 1.6 && imu.jerk < 8.0 && speed.deltaVKmH < 5.0)) {
      disagreementReport = {
        hasDisagreement: true,
        conflictingModalities: ['AUDIO', 'IMU', 'SPEED'],
        reason:
          'Acoustic spike or horn detected but vehicle kinematics remain smooth and unperturbed.',
      };

      return {
        taxonomyClass: 'SENSOR_DISAGREEMENT',
        severity: 'LOW',
        confidenceScore: 0.88,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Sensor Disagreement: Acoustic noise (horn / ambient rumble) detected without kinematic impact. Suppressed.',
      };
    }

    // =========================================================================
    // ZERO-SPEED STATIONARY GUARD (Hand Shake Filter at v = 0 km/h)
    // =========================================================================
    const isStationary =
      speed.speedBeforeKmH < thresh.stationarySpeedMaxKmH &&
      speed.speedAfterKmH < thresh.stationarySpeedMaxKmH;

    if (isStationary) {
      const isAgitatedHandMovement =
        imu.jerk > thresh.stationaryHandShakeJerkMin ||
        imu.gyroMag > thresh.stationaryHandShakeGyroMin ||
        imu.accelMag > 2.2;

      if (isAgitatedHandMovement && audioEv < 0.65) {
        return {
          taxonomyClass: 'NORMAL_DRIVING',
          severity: 'LOW',
          confidenceScore: 0.05,
          evidenceScores,
          disagreementReport,
          temporalPhase,
          requiresSOS: false,
          reasoning:
            'Stationary hand movement / phone shake detected at 0 km/h without vehicular impact. SOS suppressed.',
        };
      }
    }

    // =========================================================================
    // RULE 1: ROLLOVER / SEVERE CRASH
    // Multi-axis violent disturbance + sustained vehicle inversion / roll-pitch tumble
    // =========================================================================
    const isVehicleInversion = imu.accelZ < -2.5; // Inverted gravity vector (chassis upside down)
    const isRolloverRotation =
      (Math.abs(imu.gyroX) >= 4.5 && Math.abs(imu.gyroY) >= 4.5 && imu.gyroMag >= thresh.rolloverSustainedGyroRadS) ||
      (isVehicleInversion && imu.gyroMag >= 4.0);

    if (isRolloverRotation) {
      return {
        taxonomyClass: 'SEVERE_CRASH',
        severity: 'CRITICAL',
        confidenceScore: Math.min(0.99, Math.max(0.85, normalizedScore)),
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: true,
        reasoning:
          'Severe Rollover / High-energy multi-axis crash detected (Sustained violent angular velocity and vehicle inversion).',
      };
    }

    // =========================================================================
    // RULE 2: VEHICLE COLLISION
    // Case A: High energy kinematic collision (IMU + Decel + Gyro)
    // Case B: Moderate IMU + Confirmed Acoustic Crash (Low-speed collision)
    // =========================================================================
    const isKinematicCrash =
      (imu.peakJerkWindow >= thresh.collisionJerkMs3 ||
        speed.deltaVKmH >= thresh.collisionSpeedDropKmH ||
        imu.peakAccelWindow >= thresh.collisionAccelPeakG) &&
      imu.peakGyroWindow >= thresh.collisionGyroRadS;

    const isLowSpeedAcousticCrash =
      hasAudio &&
      audioEv >= 0.70 &&
      imu.accelMag >= thresh.lowSpeedCollisionAccelG &&
      speed.deltaVKmH >= 8.0;

    if (isKinematicCrash || isLowSpeedAcousticCrash) {
      const conf = Math.min(
        0.98,
        Math.max(0.75, normalizedScore > 0 ? normalizedScore : 0.85)
      );
      return {
        taxonomyClass: 'COLLISION',
        severity: 'CRITICAL',
        confidenceScore: conf,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: true,
        reasoning: isLowSpeedAcousticCrash
          ? `Low-speed collision verified by acoustic crash signature (${(audioEv * 100).toFixed(0)}% acoustic confidence) with vehicular deceleration.`
          : 'High-energy vehicular collision: Simultaneous acceleration shock, sharp deceleration, and angular displacement.',
      };
    }

    // =========================================================================
    // RULE 3: ROTATIONAL EVENTS (Skid vs Sharp Turn)
    // Eliminates legacy flaw where Accel ~ 0 + Gyro disturbance was ignored.
    // =========================================================================
    const isHighYawRotation = Math.abs(imu.gyroZ) >= thresh.sharpTurnYawRadS;
    const isSignificantLateral = Math.abs(imu.accelY) >= thresh.sharpTurnLateralG;

    if (isHighYawRotation || isSignificantLateral) {
      const isSkidAcoustic = hasAudio && audioClass === 'TIRE_SKID_SCREECH';
      const isSevereSkid =
        Math.abs(imu.gyroZ) >= thresh.skidYawRadS &&
        Math.abs(imu.accelY) >= thresh.skidLateralG;

      if (isSevereSkid || isSkidAcoustic) {
        return {
          taxonomyClass: 'SKID',
          severity: 'MEDIUM',
          confidenceScore: 0.86,
          evidenceScores,
          disagreementReport,
          temporalPhase,
          requiresSOS: false,
          reasoning:
            'Tire traction loss / vehicle skid detected (Elevated lateral acceleration and high yaw deflection).',
        };
      }

      // Controlled sharp turn / evasive steering
      return {
        taxonomyClass: 'SHARP_TURN',
        severity: 'MEDIUM',
        confidenceScore: 0.82,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Sharp turn / rapid evasive steering maneuver executed with maintained chassis stability.',
      };
    }

    // =========================================================================
    // RULE 4: NEAR MISS / EVASIVE EMERGENCY BRAKING
    // Sharp speed drop with high longitudinal decel & chassis level (no crash sound)
    // =========================================================================
    const isEvasiveStop =
      imu.jerk >= 18.0 &&
      speed.deltaVKmH >= thresh.hardBrakingSpeedDropKmH &&
      imu.gyroMag < thresh.collisionGyroRadS * 0.5;

    if (isEvasiveStop) {
      return {
        taxonomyClass: 'NEAR_MISS',
        severity: 'HIGH',
        confidenceScore: Math.min(
          0.94,
          Math.max(0.70, speed.deltaVKmH / thresh.collisionSpeedDropKmH)
        ),
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Near miss / emergency evasive stop detected (Violent deceleration with level chassis and no impact acoustic).',
      };
    }

    // =========================================================================
    // RULE 5: HARD BRAKING
    // Rapid decrease in speed with strong longitudinal deceleration
    // =========================================================================
    if (speed.deltaVKmH >= thresh.hardBrakingSpeedDropKmH && speed.speedBeforeKmH > 25.0) {
      return {
        taxonomyClass: 'HARD_BRAKING',
        severity: 'MEDIUM',
        confidenceScore: 0.85,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Hard braking maneuver detected: Rapid reduction in vehicle velocity.',
      };
    }

    // =========================================================================
    // RULE 6: HARD ACCELERATION
    // Rapid increase in speed with longitudinal acceleration
    // =========================================================================
    if (speed.speedProfile === 'RAPID_INCREASE' && imu.accelX < -thresh.hardAccelerationG) {
      return {
        taxonomyClass: 'HARD_ACCELERATION',
        severity: 'LOW',
        confidenceScore: 0.80,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Hard acceleration detected: High longitudinal forward push.',
      };
    }

    // =========================================================================
    // RULE 7: ROAD ANOMALIES (Pothole vs Speed Breaker vs Rough Road)
    // (Grounded in PMC9044339 Time-Domain Guidelines)
    // =========================================================================

    // A. Rough Road: High continuous vertical variance & multiple peak reversals
    if (
      imu.verticalVariance >= thresh.roughRoadVerticalVarianceMin &&
      imu.verticalPeakCount >= thresh.roughRoadPeakCountMin &&
      speed.speedAfterKmH > 15.0
    ) {
      return {
        taxonomyClass: 'ROUGH_ROAD',
        severity: 'LOW',
        confidenceScore: 0.89,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Rough / unpaved road surface detected (Sustained vertical vibration variance and high peak count).',
      };
    }

    // B. Speed Breaker: Strong vertical impulse + pitch spike + speed reduction
    const isSpeedBreaker =
      imu.accelZ >= thresh.speedBreakerVerticalImpulseG &&
      Math.abs(imu.gyroY) >= thresh.speedBreakerPitchRadS &&
      speed.deltaVKmH <= 15.0;

    if (isSpeedBreaker) {
      return {
        taxonomyClass: 'SPEED_BREAKER',
        severity: 'LOW',
        confidenceScore: 0.84,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Designed road obstacle: Speed breaker traversal detected with characteristic pitch rebound.',
      };
    }

    // C. Pothole: Sharp isolated vertical impulse with short duration & minimal speed loss
    const isPothole =
      imu.accelZ >= thresh.potholeVerticalImpulseG &&
      speed.deltaVKmH <= 8.0 &&
      imu.jerk < thresh.collisionJerkMs3;

    if (isPothole) {
      return {
        taxonomyClass: 'POTHOLE',
        severity: 'LOW',
        confidenceScore: 0.88,
        evidenceScores,
        disagreementReport,
        temporalPhase,
        requiresSOS: false,
        reasoning:
          'Road anomaly: Isolated sharp vertical pothole depression impulse logged.',
      };
    }

    // =========================================================================
    // DEFAULT: NORMAL DRIVING
    // =========================================================================
    return {
      taxonomyClass: 'NORMAL_DRIVING',
      severity: 'LOW',
      confidenceScore: 0.95,
      evidenceScores,
      disagreementReport,
      temporalPhase,
      requiresSOS: false,
      reasoning: 'Normal motion within safe operational parameters.',
    };
  }

  /**
   * Helper to map Multimodal taxonomy output to legacy AnomalyDetectionResult
   * for 100% backward compatibility with existing tests and UI screens.
   */
  public static mapToLegacyResult(
    fusion: FusionOutput,
    currentFrame: any,
    snapshot: SensorSnapshot,
    anomalyScore: number,
    gyroTurbulence: number,
    accelJerk: number,
    speedDropDelta: number
  ): AnomalyDetectionResult {
    let legacyEventType: AnomalyDetectionResult['eventType'] = 'NO_ANOMALY';

    if (fusion.taxonomyClass === 'COLLISION' || fusion.taxonomyClass === 'SEVERE_CRASH') {
      legacyEventType = 'POSSIBLE_ACCIDENT';
    } else if (fusion.taxonomyClass === 'NEAR_MISS') {
      legacyEventType = 'OBSTACLE_FACED';
    } else if (fusion.taxonomyClass === 'POTHOLE' || fusion.taxonomyClass === 'SPEED_BREAKER' || fusion.taxonomyClass === 'ROUGH_ROAD') {
      legacyEventType = 'HEAVY_BUMP';
    } else if (fusion.reasoning.includes('Stationary hand movement') || fusion.reasoning.includes('shake')) {
      legacyEventType = 'PHONE_SHAKE';
    }

    return {
      eventType: legacyEventType,
      confidenceScore: fusion.confidenceScore,
      anomalyScore,
      gyroTurbulence,
      accelJerk,
      speedDropDelta,
      snapshot,
      reasoning: fusion.reasoning,
      taxonomyClass: fusion.taxonomyClass,
      severity: fusion.severity,
      evidenceScores: fusion.evidenceScores,
      disagreementReport: fusion.disagreementReport,
      temporalPhase: fusion.temporalPhase,
      jerkMs3: accelJerk,
      speedDropPct: snapshot.speed_before > 0
        ? Number((((snapshot.speed_before - snapshot.speed_after) / snapshot.speed_before) * 100).toFixed(1))
        : 0,
    };
  }
}
