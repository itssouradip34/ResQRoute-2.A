/**
 * Speed Feature Extraction Module
 * Computes Delta V, percentage speed drop, time-to-stop, and deceleration profiles
 */

import { SensorFrame } from './SensorHub';

export interface SpeedFeatureSet {
  speedBeforeKmH: number;
  speedAfterKmH: number;
  deltaVKmH: number;
  percentageDrop: number;
  decelerationRateMs2: number;
  timeToStopSec: number;
  speedProfile: 'STEADY' | 'RAPID_DECREASE' | 'RAPID_INCREASE' | 'IRREGULAR_FLUCTUATION' | 'RESTING';
}

export class SpeedFeatureExtractor {
  public static extractFeatures(
    current: SensorFrame,
    history: SensorFrame[]
  ): SpeedFeatureSet {
    const speedAfter = Math.max(0, current.speedKmH);
    let speedBefore = speedAfter;

    if (history.length > 0) {
      // Look back to earliest window frame or baseline steady frame
      speedBefore = Math.max(0, history[0].speedKmH);
    }

    const deltaV = Math.max(0, speedBefore - speedAfter);
    const percentageDrop =
      speedBefore > 1.0 ? Number(((deltaV / speedBefore) * 100).toFixed(1)) : 0;

    const dtSeconds = Math.max(0.1, history.length * 0.1);
    const deltaVMs = (deltaV * 1000) / 3600;
    const decelerationRateMs2 = Number((deltaVMs / dtSeconds).toFixed(2));

    // Time to stop: count frames from deceleration onset until speed < 3 km/h
    let timeToStopSec = 0;
    if (speedAfter < 3.0 && deltaV > 15.0) {
      let decelFrames = 0;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].speedKmH > 3.0) {
          decelFrames++;
        } else {
          break;
        }
      }
      timeToStopSec = Number((decelFrames * 0.1).toFixed(1));
    }

    // Determine qualitative profile
    let speedProfile: SpeedFeatureSet['speedProfile'] = 'STEADY';
    if (speedAfter < 3.0 && deltaV > 20.0) {
      speedProfile = 'RESTING';
    } else if (deltaV >= 18.0) {
      speedProfile = 'RAPID_DECREASE';
    } else if (speedAfter - speedBefore >= 15.0) {
      speedProfile = 'RAPID_INCREASE';
    } else {
      // Check for irregular fluctuation
      let diffSum = 0;
      for (let i = 1; i < history.length; i++) {
        diffSum += Math.abs(history[i].speedKmH - history[i - 1].speedKmH);
      }
      if (diffSum > 25.0) {
        speedProfile = 'IRREGULAR_FLUCTUATION';
      } else {
        speedProfile = 'STEADY';
      }
    }

    return {
      speedBeforeKmH: Number(speedBefore.toFixed(1)),
      speedAfterKmH: Number(speedAfter.toFixed(1)),
      deltaVKmH: Number(deltaV.toFixed(1)),
      percentageDrop,
      decelerationRateMs2,
      timeToStopSec,
      speedProfile,
    };
  }
}
