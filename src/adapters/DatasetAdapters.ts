/**
 * Dataset Adapters & Interfaces
 * Provides standardized adapter contracts for:
 * 1. VZCrash Telematics Dataset
 * 2. Acoustic Crash & Environmental Corpora
 * 3. Road Anomaly (Pothole / Bump) Datasets (PMC9044339)
 * 4. CARLA Multimodal Synthetic Simulators (CarlAnomaly / CaScenes)
 *
 * NOTE: All synthetic or simulated datasets are strictly tagged with domain metadata
 * and never misrepresented as physical real-world data.
 */

import { SensorFrame } from '../services/sensor/SensorHub';
import { AcousticFrame } from '../services/audio/AudioCrashDetector';
import { CrashTaxonomyClass } from '../types';

export interface DatasetMetadata {
  datasetName: string;
  sourceType: 'PHYSICAL_REAL_WORLD' | 'CARLA_SYNTHETIC' | 'BENCHMARK_UNIT';
  isPhysicalData: boolean;
  sampleCount: number;
  samplingRateHz: number;
  description: string;
}

// ----------------------------------------------------
// 1. VZCrash Dataset Adapter
// ----------------------------------------------------
export interface VZCrashRawRecord {
  record_id: string;
  t_ms: number;
  accel_x: number;
  accel_y: number;
  accel_z: number;
  gyro_x: number;
  gyro_y: number;
  gyro_z: number;
  speed_kmh: number;
  ground_truth_label: string;
}

export class VZCrashAdapter {
  public static metadata: DatasetMetadata = {
    datasetName: 'VZCrash-Telematics-Benchmark',
    sourceType: 'PHYSICAL_REAL_WORLD',
    isPhysicalData: true,
    sampleCount: 1250,
    samplingRateHz: 10,
    description: 'Real-world smartphone vehicular crash and normal trip telematics dataset.',
  };

  public static toSensorFrame(raw: VZCrashRawRecord): SensorFrame {
    const mag = Math.sqrt(
      raw.accel_x * raw.accel_x +
      raw.accel_y * raw.accel_y +
      raw.accel_z * raw.accel_z
    );
    const gyroMag = Math.sqrt(
      raw.gyro_x * raw.gyro_x +
      raw.gyro_y * raw.gyro_y +
      raw.gyro_z * raw.gyro_z
    );

    return {
      timestamp: raw.t_ms,
      accel: {
        x: raw.accel_x,
        y: raw.accel_y,
        z: raw.accel_z,
        magnitude: Number(mag.toFixed(2)),
        jerk: 0, // Computed across consecutive frames
      },
      gyro: {
        x: raw.gyro_x,
        y: raw.gyro_y,
        z: raw.gyro_z,
        magnitude: Number(gyroMag.toFixed(2)),
      },
      speedKmH: raw.speed_kmh,
    };
  }
}

// ----------------------------------------------------
// 2. Audio Crash & Environmental Corpus Adapter
// ----------------------------------------------------
export interface AudioCorpusRawRecord {
  clip_id: string;
  rms_db: number;
  spectral_centroid_hz: number;
  spectral_flux: number;
  zero_crossing_rate: number;
  low_band_energy: number;
  mid_band_energy: number;
  high_band_energy: number;
  crest_factor: number;
  class_label: 'CRASH_IMPACT' | 'TIRE_SKID_SCREECH' | 'NORMAL_VEHICLE' | 'HORN_TRAFFIC';
}

export class AudioCorpusAdapter {
  public static metadata: DatasetMetadata = {
    datasetName: 'Acoustic-Crash-Environmental-Corpus',
    sourceType: 'PHYSICAL_REAL_WORLD',
    isPhysicalData: true,
    sampleCount: 840,
    samplingRateHz: 44100,
    description: 'Multi-class vehicular acoustic features containing collision crunch, tire screeches, horns, and cabin noise.',
  };

  public static toAcousticFrame(raw: AudioCorpusRawRecord): AcousticFrame {
    return {
      timestamp: Date.now(),
      rmsEnergyDb: raw.rms_db,
      spectralCentroidHz: raw.spectral_centroid_hz,
      spectralFlux: raw.spectral_flux,
      zeroCrossingRate: raw.zero_crossing_rate,
      lowBandEnergy: raw.low_band_energy,
      midBandEnergy: raw.mid_band_energy,
      highBandEnergy: raw.high_band_energy,
      crestFactor: raw.crest_factor,
    };
  }
}

// ----------------------------------------------------
// 3. Road Anomaly (Pothole / Bump) Dataset Adapter
// ----------------------------------------------------
export interface RoadAnomalyRawRecord {
  anomaly_id: string;
  anomaly_type: 'POTHOLE' | 'SPEED_BREAKER' | 'ROUGH_ROAD';
  vertical_peak_g: number;
  duration_ms: number;
  pitch_rad_s: number;
  vehicle_speed_kmh: number;
}

export class RoadAnomalyAdapter {
  public static metadata: DatasetMetadata = {
    datasetName: 'Smartphone-Road-Surface-Anomalies (PMC9044339)',
    sourceType: 'PHYSICAL_REAL_WORLD',
    isPhysicalData: true,
    sampleCount: 420,
    samplingRateHz: 10,
    description: 'Road anomaly dataset following time/frequency domain feature extraction per PMC9044339.',
  };
}

// ----------------------------------------------------
// 4. CARLA Multimodal Synthetic Simulator Adapter
// ----------------------------------------------------
export interface CarlaTelemetryFrame {
  timestamp_ms: number;
  imu: {
    accelerometer: { x: number; y: number; z: number };
    gyroscope: { x: number; y: number; z: number };
    compass_deg: number;
  };
  gnss: {
    latitude: number;
    longitude: number;
    speed_kmh: number;
  };
  weather: {
    precipitation: number;
    wetness: number;
  };
  collision_detected: boolean;
  ground_truth_taxonomy: CrashTaxonomyClass;
}

export interface CarlaScenarioSession {
  scenario_id: string;
  scenario_name: string;
  town_map: string; // e.g. 'Town03' or 'Town05'
  frames: CarlaTelemetryFrame[];
}

export class CarlaScenarioAdapter {
  public static metadata: DatasetMetadata = {
    datasetName: 'CARLA-Simulated-Telemetry-Corpus',
    sourceType: 'CARLA_SYNTHETIC',
    isPhysicalData: false, // Explicitly tagged as synthetic
    sampleCount: 50000,
    samplingRateHz: 10,
    description: 'CARLA autonomous vehicle simulator multi-sensor telemetry with synthetic IMU, GNSS, weather, and traffic actors.',
  };

  public static toSensorFrames(session: CarlaScenarioSession): SensorFrame[] {
    let lastAccelMag = 1.0;
    let lastTime = session.frames[0]?.timestamp_ms || 0;

    return session.frames.map((f, idx) => {
      const ax = f.imu.accelerometer.x;
      const ay = f.imu.accelerometer.y;
      const az = f.imu.accelerometer.z;
      const mag = Math.sqrt(ax * ax + ay * ay + az * az);
      const dt = Math.max(0.01, (f.timestamp_ms - lastTime) / 1000);
      const jerk = idx === 0 ? 0 : Math.abs(mag - lastAccelMag) / dt;

      lastAccelMag = mag;
      lastTime = f.timestamp_ms;

      const gx = f.imu.gyroscope.x;
      const gy = f.imu.gyroscope.y;
      const gz = f.imu.gyroscope.z;
      const gyroMag = Math.sqrt(gx * gx + gy * gy + gz * gz);

      return {
        timestamp: f.timestamp_ms,
        accel: {
          x: Number(ax.toFixed(2)),
          y: Number(ay.toFixed(2)),
          z: Number(az.toFixed(2)),
          magnitude: Number(mag.toFixed(2)),
          jerk: Number(jerk.toFixed(2)),
        },
        gyro: {
          x: Number(gx.toFixed(2)),
          y: Number(gy.toFixed(2)),
          z: Number(gz.toFixed(2)),
          magnitude: Number(gyroMag.toFixed(2)),
        },
        speedKmH: Number(f.gnss.speed_kmh.toFixed(1)),
      };
    });
  }
}
