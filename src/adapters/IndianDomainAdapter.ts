/**
 * Indian Domain Adaptation Layer
 * Implements domain-randomization and scenario transformations for Indian driving conditions:
 * A. Pothole-heavy sequences
 * B. Speed breakers with rebound dynamics
 * C. Rough road continuous vibrations (PMC9044339)
 * D. Mixed traffic stop-and-go
 * E. Two-wheeler lean and swerving
 * F. Monsoon lower traction & rain/wiper noise
 * G. Horn-heavy acoustic traffic noise (horn != crash)
 *
 * NOTE: All transformed frames retain their true ground-truth labels and are
 * explicitly tagged with domain metadata { domain: 'INDIAN_SIMULATED' }.
 */

import { SensorFrame } from '../services/sensor/SensorHub';
import { AcousticFrame } from '../services/audio/AudioCrashDetector';

export type IndianTransformationType =
  | 'POTHOLE_HEAVY'
  | 'SPEED_BREAKER'
  | 'ROUGH_ROAD'
  | 'MIXED_TRAFFIC'
  | 'TWO_WHEELER_INTERACTION'
  | 'MONSOON_WET_TRACTION'
  | 'HORN_HEAVY_TRAFFIC';

export interface IndianDomainMetadata {
  domain: 'INDIAN_SIMULATED';
  isPhysicalData: false;
  transformationsApplied: IndianTransformationType[];
  simulatedAt: string;
}

export interface TransformedSequence {
  frames: SensorFrame[];
  acousticFrame?: AcousticFrame;
  metadata: IndianDomainMetadata;
}

export class IndianDomainAdapter {
  /**
   * Applies selected Indian road-condition transformations to an existing sequence of frames
   */
  public static transformSequence(
    baseFrames: SensorFrame[],
    transformations: IndianTransformationType[],
    baseAcoustic?: AcousticFrame
  ): TransformedSequence {
    const frames: SensorFrame[] = baseFrames.map((f) => ({
      timestamp: f.timestamp,
      accel: { ...f.accel },
      gyro: { ...f.gyro },
      speedKmH: f.speedKmH,
    }));

    let acoustic = baseAcoustic
      ? { ...baseAcoustic }
      : {
          timestamp: Date.now(),
          rmsEnergyDb: -30.0,
          spectralCentroidHz: 1200,
          spectralFlux: 0.15,
          zeroCrossingRate: 0.08,
          lowBandEnergy: 0.60,
          midBandEnergy: 0.35,
          highBandEnergy: 0.15,
          crestFactor: 3.2,
        };

    for (const transform of transformations) {
      switch (transform) {
        // A. Pothole-heavy: normal -> pothole -> normal -> pothole
        case 'POTHOLE_HEAVY': {
          frames.forEach((f, idx) => {
            if (idx % 8 === 3) {
              f.accel.z += 2.4; // sharp vertical impulse
              f.accel.magnitude = Math.sqrt(
                f.accel.x * f.accel.x + f.accel.y * f.accel.y + f.accel.z * f.accel.z
              );
              f.gyro.y += 0.8; // short pitch spike
              f.gyro.magnitude = Math.sqrt(
                f.gyro.x * f.gyro.x + f.gyro.y * f.gyro.y + f.gyro.z * f.gyro.z
              );
            }
          });
          break;
        }

        // B. Speed breakers: speed -> sudden vertical impulse -> speed recovery
        case 'SPEED_BREAKER': {
          const mid = Math.floor(frames.length / 2);
          if (frames[mid]) {
            frames[mid].accel.z += 2.0;
            frames[mid].gyro.y += 1.8; // pitch spike
            frames[mid].speedKmH = Math.max(5, frames[mid].speedKmH - 8);
          }
          break;
        }

        // C. Rough road: small impulse -> small impulse -> small impulse (PMC9044339)
        case 'ROUGH_ROAD': {
          frames.forEach((f, idx) => {
            const jitter = (idx % 2 === 0 ? 0.65 : -0.55);
            f.accel.z += jitter;
            f.accel.magnitude = Math.sqrt(
              f.accel.x * f.accel.x + f.accel.y * f.accel.y + f.accel.z * f.accel.z
            );
            f.gyro.x += 0.25;
            f.gyro.magnitude = Math.sqrt(
              f.gyro.x * f.gyro.x + f.gyro.y * f.gyro.y + f.gyro.z * f.gyro.z
            );
          });
          acoustic.rmsEnergyDb = Math.max(acoustic.rmsEnergyDb, -24.0);
          break;
        }

        // D. Mixed traffic: normal -> braking -> acceleration -> braking -> turn
        case 'MIXED_TRAFFIC': {
          frames.forEach((f, idx) => {
            if (idx % 6 === 2) {
              f.speedKmH = Math.max(0, f.speedKmH - 12);
              f.accel.x += 2.5; // braking decel
            } else if (idx % 6 === 4) {
              f.speedKmH += 8;
              f.accel.x -= 2.0; // forward acceleration
            }
          });
          break;
        }

        // E. Two-wheeler interaction: lateral disturbance -> yaw -> braking
        case 'TWO_WHEELER_INTERACTION': {
          frames.forEach((f, idx) => {
            if (idx % 10 === 4) {
              f.accel.y += 2.8; // lateral swerve
              f.gyro.z += 1.9; // yaw rotation
              f.accel.magnitude = Math.sqrt(
                f.accel.x * f.accel.x + f.accel.y * f.accel.y + f.accel.z * f.accel.z
              );
            }
          });
          break;
        }

        // F. Monsoon: lower traction + rain noise + wiper noise + skid possibility
        case 'MONSOON_WET_TRACTION': {
          acoustic.rmsEnergyDb = -18.0; // rain/wiper background noise
          acoustic.spectralCentroidHz = 2100;
          acoustic.spectralFlux = 0.28;
          acoustic.crestFactor = 4.2;
          // Wet road enhances lateral slip
          frames.forEach((f) => {
            if (Math.abs(f.gyro.z) > 1.2) {
              f.accel.y *= 1.35; // increased lateral slip
            }
          });
          break;
        }

        // G. Horn-heavy traffic: horn != crash
        case 'HORN_HEAVY_TRAFFIC': {
          acoustic.rmsEnergyDb = -14.0;
          acoustic.spectralCentroidHz = 2850;
          acoustic.spectralFlux = 0.18; // narrow-band horn, NOT crash flux
          acoustic.crestFactor = 3.6;
          acoustic.midBandEnergy = 0.78;
          break;
        }
      }
    }

    return {
      frames,
      acousticFrame: acoustic,
      metadata: {
        domain: 'INDIAN_SIMULATED',
        isPhysicalData: false,
        transformationsApplied: [...transformations],
        simulatedAt: new Date().toISOString(),
      },
    };
  }
}
