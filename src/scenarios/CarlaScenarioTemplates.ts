/**
 * CARLA Scenario Templates & Programmatic Sweep Generator
 * Provides 11 realistic kinematic and acoustic scenarios matching the 13-class taxonomy:
 * 1. HIGH_SPEED_HEAD_ON
 * 2. REAR_END_COLLISION
 * 3. LATERAL_T_BONE
 * 4. TWO_WHEELER_SKID
 * 5. ROLLOVER_CRASH
 * 6. HARD_BRAKING_EVASIVE (Near Miss)
 * 7. DEEP_POTHOLE_HIT
 * 8. SPEED_BREAKER_PASS
 * 9. ROUGH_ROAD_VIBRATION
 * 10. PHONE_DROPPED_IN_CABIN (Sensor Disagreement)
 * 11. STATIONARY_HAND_SHAKE (Zero-Speed Guard)
 *
 * Grounded in CARLA multi-sensor simulation (CarlAnomaly / CaScenes).
 */

import { SensorFrame } from '../services/sensor/SensorHub';
import { AcousticFrame } from '../services/audio/AudioCrashDetector';
import { CrashTaxonomyClass, EventSeverity } from '../types';

export interface ExecutableScenario {
  id: string;
  name: string;
  description: string;
  groundTruthTaxonomy: CrashTaxonomyClass;
  expectedSeverity: EventSeverity;
  frames: SensorFrame[];
  acousticFrame: AcousticFrame;
}

export class CarlaScenarioTemplates {
  /**
   * 1. High Speed Head-On Collision
   * 80 km/h -> 0 km/h, violent frontal shock, loud metal crush acoustic
   */
  public static highSpeedHeadOn(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1500,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.05, y: 0.05, z: 0.05, magnitude: 0.09 },
        speedKmH: 80,
      },
      {
        timestamp: now - 800,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.05, y: 0.05, z: 0.05, magnitude: 0.09 },
        speedKmH: 80,
      },
      {
        timestamp: now,
        accel: { x: 8.5, y: -2.2, z: 3.5, magnitude: 9.45, jerk: 55 },
        gyro: { x: 1.2, y: 3.8, z: 2.1, magnitude: 4.5 },
        speedKmH: 0,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -2.0,
      spectralCentroidHz: 3300,
      spectralFlux: 1.95,
      zeroCrossingRate: 0.58,
      lowBandEnergy: 0.88,
      midBandEnergy: 0.82,
      highBandEnergy: 0.85,
      crestFactor: 15.2,
    };

    return {
      id: 'CARLA_01_HEAD_ON',
      name: 'High-Speed Head-On Collision',
      description: 'Highway head-on impact: 80 km/h to 0 km/h, 11.5g peak, violent acoustic shatter.',
      groundTruthTaxonomy: 'COLLISION',
      expectedSeverity: 'CRITICAL',
      frames,
      acousticFrame,
    };
  }

  /**
   * 2. Rear-End Collision
   * 45 km/h -> 0 km/h sudden forward whip jolt
   */
  public static rearEndCollision(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1000,
        accel: { x: 0.1, y: 0.0, z: 1.0, magnitude: 1.0, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 45,
      },
      {
        timestamp: now,
        accel: { x: -6.5, y: 0.8, z: 3.2, magnitude: 7.28, jerk: 38 },
        gyro: { x: 4.2, y: 3.5, z: 2.1, magnitude: 5.86 },
        speedKmH: 0,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -4.5,
      spectralCentroidHz: 3100,
      spectralFlux: 1.65,
      zeroCrossingRate: 0.50,
      lowBandEnergy: 0.82,
      midBandEnergy: 0.75,
      highBandEnergy: 0.78,
      crestFactor: 13.0,
    };

    return {
      id: 'CARLA_02_REAR_END',
      name: 'Rear-End Impact at Intersection',
      description: 'Traffic light rear-end smash: 45 km/h to 0 km/h with 7.3g longitudinal impulse.',
      groundTruthTaxonomy: 'COLLISION',
      expectedSeverity: 'CRITICAL',
      frames,
      acousticFrame,
    };
  }

  /**
   * 3. Lateral T-Bone Collision
   * 50 km/h -> 5 km/h, massive lateral acceleration and yaw deflection
   */
  public static lateralTBone(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1000,
        accel: { x: 0.0, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
        gyro: { x: 0.05, y: 0.05, z: 0.05, magnitude: 0.09 },
        speedKmH: 50,
      },
      {
        timestamp: now,
        accel: { x: 1.2, y: 7.8, z: 3.5, magnitude: 8.63, jerk: 42 },
        gyro: { x: 3.8, y: 2.5, z: 6.2, magnitude: 7.69 },
        speedKmH: 5,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -3.0,
      spectralCentroidHz: 3250,
      spectralFlux: 1.80,
      zeroCrossingRate: 0.52,
      lowBandEnergy: 0.85,
      midBandEnergy: 0.80,
      highBandEnergy: 0.81,
      crestFactor: 14.0,
    };

    return {
      id: 'CARLA_03_LATERAL_TBONE',
      name: 'Lateral T-Bone Junction Collision',
      description: 'Broadside intersection crash: 8.6g lateral impact and violent yaw displacement.',
      groundTruthTaxonomy: 'COLLISION',
      expectedSeverity: 'CRITICAL',
      frames,
      acousticFrame,
    };
  }

  /**
   * 4. Two-Wheeler Monsoon Skid
   * 42 km/h, high lateral force Ay and high yaw rate with tire-skid acoustic
   */
  public static twoWheelerSkid(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1000,
        accel: { x: 0.1, y: 0.2, z: 1.0, magnitude: 1.02, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 42,
      },
      {
        timestamp: now,
        accel: { x: 0.8, y: 4.8, z: 1.4, magnitude: 5.06, jerk: 14 },
        gyro: { x: 2.8, y: 1.2, z: 3.2, magnitude: 4.42 },
        speedKmH: 30,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -11.5,
      spectralCentroidHz: 3950,
      spectralFlux: 0.58,
      zeroCrossingRate: 0.44,
      lowBandEnergy: 0.20,
      midBandEnergy: 0.52,
      highBandEnergy: 0.89,
      crestFactor: 6.5,
    };

    return {
      id: 'CARLA_04_SKID',
      name: 'Monsoon Two-Wheeler Traction Loss & Skid',
      description: 'Wet road cornering slip: High lateral acceleration (4.8 m/s²) and yaw rate (3.2 rad/s).',
      groundTruthTaxonomy: 'SKID',
      expectedSeverity: 'MEDIUM',
      frames,
      acousticFrame,
    };
  }

  /**
   * 5. Rollover / Severe Crash
   * 70 km/h, multi-axis tumble with sustained high rotation rate
   */
  public static rolloverCrash(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1200,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 70,
      },
      {
        timestamp: now,
        accel: { x: 5.2, y: 6.1, z: -7.5, magnitude: 11.0, jerk: 48 },
        gyro: { x: 6.8, y: 7.2, z: 5.9, magnitude: 11.5 },
        speedKmH: 0,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -1.8,
      spectralCentroidHz: 3400,
      spectralFlux: 2.1,
      zeroCrossingRate: 0.60,
      lowBandEnergy: 0.90,
      midBandEnergy: 0.85,
      highBandEnergy: 0.88,
      crestFactor: 16.0,
    };

    return {
      id: 'CARLA_05_ROLLOVER',
      name: 'High-Speed Rollover & Inversion',
      description: 'Vehicle overturn: Sustained 11.5 rad/s multi-axis tumble and inversion.',
      groundTruthTaxonomy: 'SEVERE_CRASH',
      expectedSeverity: 'CRITICAL',
      frames,
      acousticFrame,
    };
  }

  /**
   * 6. Hard Braking / Near Miss Evasive Stop
   * 65 km/h -> 10 km/h, sharp longitudinal decel, level chassis, no crash sound
   */
  public static hardBrakingEvasive(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 1200,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.05, y: 0.05, z: 0.05, magnitude: 0.09 },
        speedKmH: 65,
      },
      {
        timestamp: now,
        accel: { x: 4.5, y: 0.3, z: 1.1, magnitude: 4.64, jerk: 26 },
        gyro: { x: 0.2, y: 0.4, z: 0.3, magnitude: 0.54 },
        speedKmH: 12,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -22.0,
      spectralCentroidHz: 1500,
      spectralFlux: 0.25,
      zeroCrossingRate: 0.12,
      lowBandEnergy: 0.45,
      midBandEnergy: 0.40,
      highBandEnergy: 0.25,
      crestFactor: 4.1,
    };

    return {
      id: 'CARLA_06_NEAR_MISS',
      name: 'Evasive Emergency Stop (Pedestrian/Cow Cut-In)',
      description: 'Sharp 53 km/h speed drop with level chassis and zero impact acoustic.',
      groundTruthTaxonomy: 'NEAR_MISS',
      expectedSeverity: 'HIGH',
      frames,
      acousticFrame,
    };
  }

  /**
   * 7. Deep Pothole Hit
   * 40 km/h, sharp vertical spike Az >= 2.5g, speed maintained
   */
  public static deepPotholeHit(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 600,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 40,
      },
      {
        timestamp: now,
        accel: { x: 0.2, y: 0.1, z: 2.6, magnitude: 2.61, jerk: 12 },
        gyro: { x: 0.2, y: 0.3, z: 0.1, magnitude: 0.37 },
        speedKmH: 39,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -24.0,
      spectralCentroidHz: 1400,
      spectralFlux: 0.30,
      zeroCrossingRate: 0.15,
      lowBandEnergy: 0.60,
      midBandEnergy: 0.35,
      highBandEnergy: 0.15,
      crestFactor: 4.5,
    };

    return {
      id: 'CARLA_07_POTHOLE',
      name: 'Deep Monsoon Pothole Hit at 40 km/h',
      description: 'Isolated vertical shock (2.6g) without velocity drop or angular tumble.',
      groundTruthTaxonomy: 'POTHOLE',
      expectedSeverity: 'LOW',
      frames,
      acousticFrame,
    };
  }

  /**
   * 8. Speed Breaker Pass
   * 28 km/h, vertical impulse + pitch rebound, temporary speed dip
   */
  public static speedBreakerPass(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 800,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 28,
      },
      {
        timestamp: now,
        accel: { x: 0.3, y: 0.2, z: 1.9, magnitude: 1.93, jerk: 8 },
        gyro: { x: 0.2, y: 1.8, z: 0.3, magnitude: 1.84 },
        speedKmH: 20,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -26.0,
      spectralCentroidHz: 1100,
      spectralFlux: 0.20,
      zeroCrossingRate: 0.10,
      lowBandEnergy: 0.70,
      midBandEnergy: 0.25,
      highBandEnergy: 0.10,
      crestFactor: 3.8,
    };

    return {
      id: 'CARLA_08_SPEED_BREAKER',
      name: 'Speed Breaker Traversal',
      description: 'Designed road obstacle: 1.9g vertical hump and characteristic pitch oscillation.',
      groundTruthTaxonomy: 'SPEED_BREAKER',
      expectedSeverity: 'LOW',
      frames,
      acousticFrame,
    };
  }

  /**
   * 9. Rough Road Continuous Vibration (PMC9044339)
   * 35 km/h, continuous high vertical variance & frequent peak reversals
   */
  public static roughRoadVibration(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [];
    for (let i = 0; i < 12; i++) {
      const zImpulse = 1.0 + (i % 2 === 0 ? 0.8 : -0.7);
      frames.push({
        timestamp: now - (12 - i) * 100,
        accel: {
          x: 0.1,
          y: 0.1,
          z: zImpulse,
          magnitude: Math.sqrt(0.02 + zImpulse * zImpulse),
          jerk: 6,
        },
        gyro: { x: 0.2, y: 0.3, z: 0.2, magnitude: 0.41 },
        speedKmH: 35,
      });
    }

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -23.0,
      spectralCentroidHz: 1350,
      spectralFlux: 0.22,
      zeroCrossingRate: 0.18,
      lowBandEnergy: 0.65,
      midBandEnergy: 0.30,
      highBandEnergy: 0.15,
      crestFactor: 3.5,
    };

    return {
      id: 'CARLA_09_ROUGH_ROAD',
      name: 'Gravel / Rough Road Sustained Vibration',
      description: 'Continuous road surface irregularities: High vertical variance (PMC9044339).',
      groundTruthTaxonomy: 'ROUGH_ROAD',
      expectedSeverity: 'LOW',
      frames,
      acousticFrame,
    };
  }

  /**
   * 10. Phone Dropped In Cabin at 50 km/h (Sensor Disagreement)
   * Huge acceleration impulse, but speed steady, no crash acoustic
   */
  public static phoneDroppedInCabin(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 800,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.01, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 50,
      },
      {
        timestamp: now,
        accel: { x: 4.8, y: -3.5, z: 3.2, magnitude: 6.75, jerk: 35 },
        gyro: { x: 4.2, y: 3.1, z: 2.8, magnitude: 5.92 },
        speedKmH: 50, // Cruise speed unchanged!
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -28.0, // Normal cabin, NO metal crunch/glass shatter
      spectralCentroidHz: 1200,
      spectralFlux: 0.16,
      zeroCrossingRate: 0.08,
      lowBandEnergy: 0.60,
      midBandEnergy: 0.35,
      highBandEnergy: 0.12,
      crestFactor: 3.2,
    };

    return {
      id: 'CARLA_10_PHONE_DROP',
      name: 'Phone Dropped from Mount to Car Floor',
      description: 'Sensor Disagreement: 6.75g impulse while vehicle cruises steadily at 50 km/h.',
      groundTruthTaxonomy: 'SENSOR_DISAGREEMENT',
      expectedSeverity: 'LOW',
      frames,
      acousticFrame,
    };
  }

  /**
   * 11. Stationary Hand Shake at Red Light (Zero-Speed Guard)
   * 0 km/h hand agitation without vehicular momentum
   */
  public static stationaryHandShake(): ExecutableScenario {
    const now = Date.now();
    const frames: SensorFrame[] = [
      {
        timestamp: now - 500,
        accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
        gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.17 },
        speedKmH: 0,
      },
      {
        timestamp: now,
        accel: { x: 3.5, y: -4.0, z: 2.5, magnitude: 5.87, jerk: 38 },
        gyro: { x: 5.2, y: 6.1, z: 4.8, magnitude: 9.34 },
        speedKmH: 0,
      },
    ];

    const acousticFrame: AcousticFrame = {
      timestamp: now,
      rmsEnergyDb: -32.0,
      spectralCentroidHz: 950,
      spectralFlux: 0.15,
      zeroCrossingRate: 0.06,
      lowBandEnergy: 0.65,
      midBandEnergy: 0.35,
      highBandEnergy: 0.12,
      crestFactor: 3.1,
    };

    return {
      id: 'CARLA_11_HAND_SHAKE',
      name: 'Stationary Hand Shake at v = 0 km/h',
      description: 'Zero-speed filter: Vigorous phone shake while stopped at red light.',
      groundTruthTaxonomy: 'NORMAL_DRIVING',
      expectedSeverity: 'LOW',
      frames,
      acousticFrame,
    };
  }

  /**
   * Returns all 11 predefined scenario templates
   */
  public static getAllScenarios(): ExecutableScenario[] {
    return [
      this.highSpeedHeadOn(),
      this.rearEndCollision(),
      this.lateralTBone(),
      this.twoWheelerSkid(),
      this.rolloverCrash(),
      this.hardBrakingEvasive(),
      this.deepPotholeHit(),
      this.speedBreakerPass(),
      this.roughRoadVibration(),
      this.phoneDroppedInCabin(),
      this.stationaryHandShake(),
    ];
  }
}
