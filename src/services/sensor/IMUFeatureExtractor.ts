/**
 * IMU Feature Extraction Module
 * Extracts 3D projections, jerk, variances, peak counts, and rotational rates
 * Grounded in PMC9044339 machine learning guidelines for road anomalies and kinematic crash analysis.
 */

import { SensorFrame } from './SensorHub';

export interface IMUFeatureSet {
  // Magnitudes
  accelMag: number; // A_mag = sqrt(Ax^2 + Ay^2 + Az^2)
  gyroMag: number;  // G_mag = sqrt(Gx^2 + Gy^2 + Gz^2)

  // 3-Axis Instantaneous
  accelX: number; // Longitudinal (acceleration / braking)
  accelY: number; // Lateral (swerves / cornering / skids)
  accelZ: number; // Vertical (road roughness / potholes / speed breakers)

  gyroX: number;  // Roll rate
  gyroY: number;  // Pitch rate
  gyroZ: number;  // Yaw rate

  // Jerk Derivative J = dA / dt
  jerk: number;
  peakJerkWindow: number;
  peakAccelWindow: number;
  peakGyroWindow: number;

  // Window Statistics (PMC9044339)
  verticalVariance: number;    // Var(Az) over sliding window
  lateralVariance: number;     // Var(Ay)
  longitudinalVariance: number;// Var(Ax)
  gyroVariance: number;        // Var(G_mag)
  verticalPeakCount: number;   // Number of local extrema reversals in Az
  disturbanceDurationMs: number;
}

export class IMUFeatureExtractor {
  /**
   * Compute instantaneous and sliding-window IMU features
   */
  public static extractFeatures(
    current: SensorFrame,
    history: SensorFrame[]
  ): IMUFeatureSet {
    const accelMag = current.accel.magnitude;
    const gyroMag = current.gyro.magnitude;

    const accelX = current.accel.x;
    const accelY = current.accel.y;
    const accelZ = current.accel.z;

    const gyroX = current.gyro.x;
    const gyroY = current.gyro.y;
    const gyroZ = current.gyro.z;

    const jerk = current.accel.jerk;

    // Window metrics across history including current frame
    const allFrames = [...history, current];
    let peakJerk = jerk;
    let peakAccel = accelMag;
    let peakGyro = gyroMag;

    let sumAz = 0;
    let sumAy = 0;
    let sumAx = 0;
    let sumG = 0;

    for (const f of allFrames) {
      if (f.accel.jerk > peakJerk) peakJerk = f.accel.jerk;
      if (f.accel.magnitude > peakAccel) peakAccel = f.accel.magnitude;
      if (f.gyro.magnitude > peakGyro) peakGyro = f.gyro.magnitude;

      sumAz += f.accel.z;
      sumAy += f.accel.y;
      sumAx += f.accel.x;
      sumG += f.gyro.magnitude;
    }

    const n = Math.max(1, allFrames.length);
    const meanAz = sumAz / n;
    const meanAy = sumAy / n;
    const meanAx = sumAx / n;
    const meanG = sumG / n;

    let varAzSum = 0;
    let varAySum = 0;
    let varAxSum = 0;
    let varGSum = 0;

    for (const f of allFrames) {
      varAzSum += Math.pow(f.accel.z - meanAz, 2);
      varAySum += Math.pow(f.accel.y - meanAy, 2);
      varAxSum += Math.pow(f.accel.x - meanAx, 2);
      varGSum += Math.pow(f.gyro.magnitude - meanG, 2);
    }

    const verticalVariance = varAzSum / n;
    const lateralVariance = varAySum / n;
    const longitudinalVariance = varAxSum / n;
    const gyroVariance = varGSum / n;

    // Vertical peak count (PMC9044339 local extrema detection for rough road vs single pothole)
    let verticalPeakCount = 0;
    for (let i = 1; i < allFrames.length - 1; i++) {
      const prev = allFrames[i - 1].accel.z;
      const curr = allFrames[i].accel.z;
      const next = allFrames[i + 1].accel.z;
      if ((curr > prev && curr > next && Math.abs(curr - meanAz) > 0.4) ||
          (curr < prev && curr < next && Math.abs(curr - meanAz) > 0.4)) {
        verticalPeakCount++;
      }
    }

    // Disturbance duration: count how long consecutive frames exceed threshold
    let disturbanceDurationMs = 0;
    for (let i = allFrames.length - 1; i >= 0; i--) {
      const f = allFrames[i];
      if (f.accel.magnitude > 1.8 || f.gyro.magnitude > 1.5 || f.accel.jerk > 10) {
        disturbanceDurationMs += 100; // approximate 10Hz sampling
      } else {
        break;
      }
    }

    return {
      accelMag: Number(accelMag.toFixed(2)),
      gyroMag: Number(gyroMag.toFixed(2)),
      accelX: Number(accelX.toFixed(2)),
      accelY: Number(accelY.toFixed(2)),
      accelZ: Number(accelZ.toFixed(2)),
      gyroX: Number(gyroX.toFixed(2)),
      gyroY: Number(gyroY.toFixed(2)),
      gyroZ: Number(gyroZ.toFixed(2)),
      jerk: Number(jerk.toFixed(2)),
      peakJerkWindow: Number(peakJerk.toFixed(2)),
      peakAccelWindow: Number(peakAccel.toFixed(2)),
      peakGyroWindow: Number(peakGyro.toFixed(2)),
      verticalVariance: Number(verticalVariance.toFixed(3)),
      lateralVariance: Number(lateralVariance.toFixed(3)),
      longitudinalVariance: Number(longitudinalVariance.toFixed(3)),
      gyroVariance: Number(gyroVariance.toFixed(3)),
      verticalPeakCount,
      disturbanceDurationMs,
    };
  }
}
