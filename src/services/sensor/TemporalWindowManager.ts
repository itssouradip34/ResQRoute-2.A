/**
 * Temporal Window Manager
 * Implements 5-phase sliding temporal windowing:
 * PRE_EVENT -> DISTURBANCE -> PEAK -> RECOVERY -> POST_EVENT
 */

import { SensorFrame } from './SensorHub';
import { TemporalPhase } from '../../types';
import { TEMPORAL_WINDOW_CONFIG } from '../../config/telematicsConfig';

export interface PartitionedWindow {
  currentPhase: TemporalPhase;
  preEventFrames: SensorFrame[];
  disturbanceFrames: SensorFrame[];
  peakFrames: SensorFrame[];
  recoveryFrames: SensorFrame[];
  postEventFrames: SensorFrame[];
}

export class TemporalWindowManager {
  private buffer: SensorFrame[] = [];
  private readonly maxFrames: number;

  constructor(maxFrames: number = TEMPORAL_WINDOW_CONFIG.MAX_FRAMES) {
    this.maxFrames = maxFrames;
  }

  public addFrame(frame: SensorFrame) {
    this.buffer.push(frame);
    if (this.buffer.length > this.maxFrames) {
      this.buffer.shift();
    }
  }

  public getBuffer(): SensorFrame[] {
    return [...this.buffer];
  }

  public clear() {
    this.buffer = [];
  }

  /**
   * Determine the current temporal phase of the vehicle kinematic state
   */
  public evaluatePhase(current: SensorFrame): TemporalPhase {
    if (this.buffer.length < 5) {
      return 'PRE_EVENT';
    }

    const accelMag = current.accel.magnitude;
    const gyroMag = current.gyro.magnitude;
    const jerk = current.accel.jerk;

    // Peak stage: extreme immediate impulse
    if (jerk >= 20.0 || accelMag >= 5.0 || gyroMag >= 4.0) {
      return 'PEAK';
    }

    // Disturbance stage: moderate anomaly onset
    if (jerk >= 10.0 || accelMag >= 2.2 || gyroMag >= 2.0) {
      return 'DISTURBANCE';
    }

    // Check recent history for peak
    let hadRecentPeak = false;
    let peakIndex = -1;
    for (let i = this.buffer.length - 1; i >= Math.max(0, this.buffer.length - 15); i--) {
      const f = this.buffer[i];
      if (f.accel.jerk >= 20.0 || f.accel.magnitude >= 4.5 || f.gyro.magnitude >= 3.8) {
        hadRecentPeak = true;
        peakIndex = i;
        break;
      }
    }

    if (hadRecentPeak) {
      const framesSincePeak = this.buffer.length - 1 - peakIndex;
      if (framesSincePeak <= 12) {
        return 'RECOVERY';
      } else {
        return 'POST_EVENT';
      }
    }

    return 'PRE_EVENT';
  }

  /**
   * Partition the current buffer into the 5 stages
   */
  public partitionWindow(current: SensorFrame): PartitionedWindow {
    const currentPhase = this.evaluatePhase(current);
    const n = this.buffer.length;

    // Approximate temporal slices based on 10Hz sampling
    const preCount = Math.min(n, 15);
    const distCount = Math.min(Math.max(0, n - preCount), 5);
    const peakCount = Math.min(Math.max(0, n - preCount - distCount), 3);
    const recCount = Math.min(Math.max(0, n - preCount - distCount - peakCount), 12);

    return {
      currentPhase,
      preEventFrames: this.buffer.slice(0, preCount),
      disturbanceFrames: this.buffer.slice(preCount, preCount + distCount),
      peakFrames: this.buffer.slice(preCount + distCount, preCount + distCount + peakCount),
      recoveryFrames: this.buffer.slice(
        preCount + distCount + peakCount,
        preCount + distCount + peakCount + recCount
      ),
      postEventFrames: this.buffer.slice(preCount + distCount + peakCount + recCount),
    };
  }
}
