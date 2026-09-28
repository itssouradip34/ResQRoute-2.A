import { AnomalyDetector } from '../src/services/sensor/AnomalyDetector';
import { NeuralKinematicsClassifier } from '../src/services/sensor/NeuralKinematicsClassifier';
import { AudioCrashDetector } from '../src/services/audio/AudioCrashDetector';
import { PersonalizedThresholdAdapter } from '../src/services/sensor/PersonalizedThresholdAdapter';
import { ForensicBlackboxService } from '../src/services/forensics/ForensicBlackboxService';
import { LiveNearbyServicesFetcher } from '../src/services/directory/LiveNearbyServicesFetcher';
import { ServiceRanker } from '../src/services/directory/ServiceRanker';
import { AITriageEngine } from '../src/services/ai/AITriageEngine';
import { INDIA_EMERGENCY_SERVICES, NATIONAL_HELPLINES } from '../src/data/indiaEmergencyServices';
import { UserLocation, SensorSnapshot } from '../src/types';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAIL: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASS: ${message}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('🧪 RESQROUTE-A (v2.0) EXTENDED TEST & VERIFICATION SUITE');
  console.log('======================================================\n');

  // ----------------------------------------------------
  // TEST 1: Rule C: Both Intensity Change -> Accident
  // ----------------------------------------------------
  console.log('--- TEST 1: Rule C: Both Intensity Change (Highway Collision) ---');
  AnomalyDetector.resetCooldown();
  const crashHistory = [
    {
      timestamp: Date.now() - 1000,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.15 },
      speedKmH: 85,
    },
  ];
  const crashCurrent = {
    timestamp: Date.now(),
    accel: { x: 5.0, y: -6.0, z: 8.0, magnitude: 11.18, jerk: 45 },
    gyro: { x: 6.5, y: 8.0, z: 5.0, magnitude: 11.45 },
    speedKmH: 0,
  };

  const crashResult = AnomalyDetector.evaluateFrame(crashCurrent, crashHistory);
  assert(
    crashResult.eventType === 'POSSIBLE_ACCIDENT',
    `Expected POSSIBLE_ACCIDENT, got ${crashResult.eventType}`
  );
  assert(
    crashResult.confidenceScore >= 0.7,
    `Expected confidence >= 0.7, got ${crashResult.confidenceScore}`
  );
  assert(
    crashResult.snapshot.speed_before === 85 && crashResult.snapshot.speed_after === 0,
    'Expected speed drop from 85 to 0 captured in snapshot'
  );

  // ----------------------------------------------------
  // TEST 2: Rule A: Sudden Drop in Accel & No Gyro Break -> Obstacle Faced
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Rule A: Sudden Drop in Accel & No Gyro Break (Obstacle Faced) ---');
  AnomalyDetector.resetCooldown();
  const obstacleHistory = [
    {
      timestamp: Date.now() - 1200,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.05, y: 0.05, z: 0.05, magnitude: 0.08 },
      speedKmH: 65,
    },
  ];
  const obstacleCurrent = {
    timestamp: Date.now(),
    accel: { x: 0.2, y: 0.2, z: 1.1, magnitude: 1.13, jerk: 26 }, // sudden deceleration jerk
    gyro: { x: 0.15, y: 0.20, z: 0.10, magnitude: 0.27 }, // NO gyro intensity break (chassis level)
    speedKmH: 15, // sharp drop of 50 km/h (speed drop >= 22)
  };

  const obstacleResult = AnomalyDetector.evaluateFrame(obstacleCurrent, obstacleHistory);
  assert(
    obstacleResult.eventType === 'OBSTACLE_FACED',
    `Expected OBSTACLE_FACED, got ${obstacleResult.eventType}`
  );
  assert(
    obstacleResult.confidenceScore >= 0.65,
    `Expected confidence >= 0.65, got ${obstacleResult.confidenceScore}`
  );

  // ----------------------------------------------------
  // TEST 3: Rule B: Accel No Intensity Change, Gyro Change Obvious -> Heavy Bump
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Rule B: Accel Steady, Gyro Obvious (Heavy Bump) ---');
  AnomalyDetector.resetCooldown();
  const bumpHistory = [
    {
      timestamp: Date.now() - 400,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.15 },
      speedKmH: 30,
    },
  ];
  const bumpCurrent = {
    timestamp: Date.now(),
    accel: { x: 0.3, y: 0.2, z: 1.4, magnitude: 1.44, jerk: 8 }, // no severe crash shock
    gyro: { x: 2.2, y: 2.8, z: 1.1, magnitude: 3.72 }, // obvious angular pitch/roll over speed-breaker
    speedKmH: 29, // speed maintained (speedDrop <= 5)
  };

  const bumpResult = AnomalyDetector.evaluateFrame(bumpCurrent, bumpHistory);
  assert(
    bumpResult.eventType === 'HEAVY_BUMP',
    `Expected HEAVY_BUMP, got ${bumpResult.eventType}`
  );
  assert(
    bumpResult.confidenceScore <= 0.30,
    `Heavy bump must have low confidence to suppress SOS, got ${bumpResult.confidenceScore}`
  );

  // ----------------------------------------------------
  // TEST 4: Zero-Speed Stationary Hand-Shake False Positive Filter
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Zero-Speed Stationary Hand Shake (v = 0 km/h False Positive Filter) ---');
  AnomalyDetector.resetCooldown();
  const stationaryHistory = [
    {
      timestamp: Date.now() - 500,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.15 },
      speedKmH: 0, // speed before is 0
    },
  ];
  const stationaryShakeCurrent = {
    timestamp: Date.now(),
    accel: { x: 3.5, y: -4.0, z: 2.5, magnitude: 5.87, jerk: 38 }, // violent hand shake
    gyro: { x: 5.2, y: 6.1, z: 4.8, magnitude: 9.34 }, // violent wrist flick rotation
    speedKmH: 0, // speed after is 0 (stationary)
  };

  const shakeResult = AnomalyDetector.evaluateFrame(stationaryShakeCurrent, stationaryHistory);
  assert(
    shakeResult.eventType === 'PHONE_SHAKE',
    `Expected PHONE_SHAKE for stationary movement, got ${shakeResult.eventType}`
  );
  assert(
    shakeResult.confidenceScore <= 0.1,
    `Stationary shake must have very low confidence, got ${shakeResult.confidenceScore}`
  );

  // ----------------------------------------------------
  // TEST 5: Personalized Dynamic Threshold Adaptation (Two-Wheeler & Novice)
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Personalized Dynamic Threshold Adaptation ---');
  const baseThresholds = AnomalyDetector.getThresholds();
  const bikeThresholds = PersonalizedThresholdAdapter.adapt(baseThresholds, {
    vehicleType: 'two_wheeler',
    experienceLevel: 'intermediate',
    drivingStyle: 'standard',
  });

  assert(
    bikeThresholds.bumpGyroMin > baseThresholds.bumpGyroMin,
    `Two-wheeler bumpGyroMin (${bikeThresholds.bumpGyroMin}) must be higher than base (${baseThresholds.bumpGyroMin}) to allow motorcycle cornering lean`
  );
  assert(
    bikeThresholds.obstacleSpeedDropThreshold < baseThresholds.obstacleSpeedDropThreshold,
    'Two-wheeler obstacle speed drop threshold should be more sensitive to low-speed collisions'
  );

  const noviceThresholds = PersonalizedThresholdAdapter.adapt(baseThresholds, {
    vehicleType: 'four_wheeler',
    experienceLevel: 'novice',
    drivingStyle: 'standard',
  });
  assert(
    noviceThresholds.obstacleJerkThreshold > baseThresholds.obstacleJerkThreshold,
    'Novice profile should provide cushion for stall-braking jerks'
  );

  // ----------------------------------------------------
  // TEST 6: Pothole / Rough Road Suppression
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Pothole / Rough Road Suppression (NO_ANOMALY) ---');
  AnomalyDetector.resetCooldown();
  const potholeHistory = [
    {
      timestamp: Date.now() - 500,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.1 },
      speedKmH: 45,
    },
  ];
  const potholeCurrent = {
    timestamp: Date.now(),
    accel: { x: 0.2, y: 0.1, z: 2.8, magnitude: 2.81, jerk: 12 },
    gyro: { x: 0.1, y: 0.2, z: 0.1, magnitude: 0.24 }, // minimal gyro (< bumpGyroMin)
    speedKmH: 45, // steady speed
  };

  const potholeResult = AnomalyDetector.evaluateFrame(potholeCurrent, potholeHistory);
  assert(
    potholeResult.eventType === 'NO_ANOMALY',
    `Pothole must be suppressed to NO_ANOMALY, got ${potholeResult.eventType}`
  );

  // ----------------------------------------------------
  // TEST 7: Mechanical Drag / Tyre Blowout Detection
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Mechanical Drag / Tyre Blowout Detection ---');
  AnomalyDetector.resetCooldown();
  const punctureHistory = [
    {
      timestamp: Date.now() - 1200,
      accel: { x: 0.1, y: 0.1, z: 1.0, magnitude: 1.0, jerk: 0 },
      gyro: { x: 0.1, y: 0.1, z: 0.1, magnitude: 0.1 },
      speedKmH: 75,
    },
  ];
  const punctureCurrent = {
    timestamp: Date.now(),
    accel: { x: 0.5, y: 0.8, z: 1.2, magnitude: 1.52, jerk: 6 },
    gyro: { x: 0.5, y: 0.6, z: 0.4, magnitude: 0.87 }, // low gyro, no roll
    speedKmH: 20, // sharp drop of 55 km/h
  };

  const punctureResult = AnomalyDetector.evaluateFrame(punctureCurrent, punctureHistory);
  assert(
    punctureResult.eventType === 'POSSIBLE_BREAKDOWN',
    `Expected POSSIBLE_BREAKDOWN, got ${punctureResult.eventType}`
  );

  // ----------------------------------------------------
  // TEST 8: VZCrash Neural Kinematics Classifier (Zero .pt)
  // ----------------------------------------------------
  console.log('\n--- TEST 8: VZCrash Neural Kinematics Classifier (Zero .pt) ---');
  const crashPrediction = NeuralKinematicsClassifier.predict({
    accelPeakG: 14.5,
    accelJerk: 50.0,
    speedDropDeltaKmH: 75.0,
    gyroMagnitudeRadS: 9.8,
  });
  assert(
    crashPrediction.predictedClass === 'POSSIBLE_ACCIDENT',
    `Expected neural predicted class POSSIBLE_ACCIDENT, got ${crashPrediction.predictedClass}`
  );
  assert(
    crashPrediction.confidence >= 0.75,
    `Expected confidence >= 0.75, got ${crashPrediction.confidence}`
  );
  assert(
    crashPrediction.probabilities.POSSIBLE_ACCIDENT > 0.80,
    `Expected POSSIBLE_ACCIDENT probability > 0.80, got ${crashPrediction.probabilities.POSSIBLE_ACCIDENT}`
  );

  const safePrediction = NeuralKinematicsClassifier.predict({
    accelPeakG: 1.0,
    accelJerk: 1.5,
    speedDropDeltaKmH: 0.0,
    gyroMagnitudeRadS: 0.2,
  });
  assert(
    safePrediction.predictedClass === 'NORMAL_DRIVING',
    `Expected NORMAL_DRIVING for safe motion, got ${safePrediction.predictedClass}`
  );

  // ----------------------------------------------------
  // TEST 9: Sound Observation Crash Detector & Consent Guard
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Sound Observation Crash Detector & Consent Guard ---');
  AudioCrashDetector.setConsentGranted(false);
  const unconsentedStart = await AudioCrashDetector.startMonitoring();
  assert(
    unconsentedStart.started === false,
    'Acoustic monitoring must NOT start without explicit user permit'
  );

  AudioCrashDetector.setConsentGranted(true);
  const consentedStart = await AudioCrashDetector.startMonitoring();
  assert(consentedStart.started === true, 'Acoustic monitoring must start after consent granted');

  const acousticCrash = AudioCrashDetector.simulateAcousticEvent('crash');
  assert(
    acousticCrash.predictedClass === 'CRASH_IMPACT',
    `Expected CRASH_IMPACT, got ${acousticCrash.predictedClass}`
  );
  assert(
    acousticCrash.isCrashEvent === true && acousticCrash.requiresSOS === true,
    'Acoustic crash must trigger isCrashEvent and requiresSOS'
  );

  AudioCrashDetector.stopMonitoring();

  // ----------------------------------------------------
  // TEST 10: Forensic Blackbox Flight Recorder & Cryptographic Hash Seal
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Forensic Blackbox Flight Recorder & Cryptographic Seal ---');
  const userLocDelhi: UserLocation = {
    latitude: 28.5672,
    longitude: 77.2100, // AIIMS New Delhi
    addressName: 'Ring Road, Near AIIMS, New Delhi',
    regionCode: 'IN-DL',
  };

  const mockSnapshot: SensorSnapshot = {
    accel_peak: 11.2,
    gyro_peak: 10.4,
    speed_before: 85,
    speed_after: 0,
    raw_anomaly_score: 9.2,
    threshold_used: 5.5,
    captured_at: new Date().toISOString(),
  };

  const forensicPacket = await ForensicBlackboxService.captureAndSyncPacket(
    'test_incident_101',
    mockSnapshot,
    userLocDelhi,
    'user_test_99',
    'Souradip Ghosh',
    'four_wheeler'
  );

  assert(
    forensicPacket.cryptographicHashSha256.startsWith('SHA256-'),
    `Cryptographic hash must start with SHA256-, got ${forensicPacket.cryptographicHashSha256}`
  );
  assert(
    forensicPacket.speedDeltaKmH === 85,
    `Expected speed delta 85 km/h, got ${forensicPacket.speedDeltaKmH}`
  );
  assert(
    forensicPacket.policeSummaryNote.includes('85 km/h'),
    'Police investigation summary must contain pre-crash speed'
  );

  // ----------------------------------------------------
  // TEST 11: Live Nearby Services Haversine Calculator
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Live Nearby Services Haversine Distance ---');
  // Distance from AIIMS Delhi (28.5672, 77.2100) to India Gate (28.6129, 77.2295) is ~5.4 km
  const testDist = LiveNearbyServicesFetcher.calculateDistanceKm(
    28.5672,
    77.2100,
    28.6129,
    77.2295
  );
  assert(
    testDist >= 5.0 && testDist <= 6.0,
    `Expected distance between AIIMS and India Gate ~5.4km, got ${testDist}km`
  );

  // ----------------------------------------------------
  // TEST 12: Service Ranker - Weighted Scoring & Categorization
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Service Ranker & Nearest Categorization ---');
  const rankedAccident = ServiceRanker.rankServices(
    {
      userLocation: userLocDelhi,
      situationType: 'accident',
    },
    INDIA_EMERGENCY_SERVICES
  );

  assert(rankedAccident.length > 0, 'Ranked accident services list must not be empty');
  assert(
    rankedAccident[0].category === 'hospital' || rankedAccident[0].category === 'ambulance',
    `Top result for accident must be hospital or ambulance, got ${rankedAccident[0].category}`
  );

  // ----------------------------------------------------
  // TEST 13: AI Triage Engine & Clarifying Questions
  // ----------------------------------------------------
  console.log('\n--- TEST 13: AI Triage NLP & Safety Guardrails ---');
  const triageAccident = await AITriageEngine.analyzeEmergencyText(
    'Two cars crashed on the ring road, driver is bleeding and unconscious',
    userLocDelhi,
    'en'
  );

  assert(
    triageAccident.classification.situationType === 'accident',
    `Expected accident triage, got ${triageAccident.classification.situationType}`
  );
  assert(
    triageAccident.classification.urgencyLevel === 'critical',
    `Expected critical urgency, got ${triageAccident.classification.urgencyLevel}`
  );
  assert(
    triageAccident.classification.firstResponseGuidance.length >= 3,
    'AI must provide clear first-response safety guidance steps'
  );

  // ----------------------------------------------------
  // TEST 14: National Helplines & Regional Directory
  // ----------------------------------------------------
  console.log('\n--- TEST 14: National Helplines & Regional Directory ---');
  assert(NATIONAL_HELPLINES.length >= 6, 'Must contain all key Indian national helplines');
  assert(
    NATIONAL_HELPLINES.some((h) => h.code === '112') &&
      NATIONAL_HELPLINES.some((h) => h.code === '108') &&
      NATIONAL_HELPLINES.some((h) => h.code === '1033'),
    'Must include 112, 108, and 1033 NHAI helplines'
  );

  console.log('\n======================================================');
  console.log('🎉 ALL 14 EXTENDED TEST SUITES PASSED PERFECTLY!');
  console.log('======================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
});
