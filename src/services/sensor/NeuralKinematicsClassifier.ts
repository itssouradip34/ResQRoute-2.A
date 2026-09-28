import kinematicsModelData from '../../models/kinematics_model.json';

export type KinematicClass =
  | 'NORMAL_DRIVING'
  | 'OBSTACLE_FACED'
  | 'HEAVY_BUMP'
  | 'POSSIBLE_ACCIDENT';

export interface KinematicPrediction {
  predictedClass: KinematicClass;
  confidence: number;
  probabilities: Record<KinematicClass, number>;
  ruleMatched?: string;
}

export interface RawKinematicInput {
  accelPeakG: number;
  accelJerk: number;
  speedDropDeltaKmH: number;
  gyroMagnitudeRadS: number;
  gyroJerkRadS2?: number;
}

export class NeuralKinematicsClassifier {
  private static model = kinematicsModelData;

  /**
   * ReLU activation
   */
  private static relu(x: number): number {
    return Math.max(0, x);
  }

  /**
   * Softmax activation
   */
  private static softmax(logits: number[]): number[] {
    const maxVal = Math.max(...logits);
    const expVals = logits.map((v) => Math.exp(v - maxVal));
    const sumExp = expVals.reduce((a, b) => a + b, 0);
    return expVals.map((v) => v / (sumExp || 1));
  }

  /**
   * Dense linear layer computation
   */
  private static dense(
    inputs: number[],
    weights: number[][],
    biases: number[],
    activation: 'relu' | 'softmax' | 'none'
  ): number[] {
    const outputs: number[] = [];
    for (let i = 0; i < biases.length; i++) {
      let sum = biases[i];
      for (let j = 0; j < inputs.length; j++) {
        sum += inputs[j] * weights[i][j];
      }
      outputs.push(activation === 'relu' ? this.relu(sum) : sum);
    }
    return activation === 'softmax' ? this.softmax(outputs) : outputs;
  }

  /**
   * Evaluate kinematic inputs using trained VZCrash weights & deterministic real-life rules
   */
  public static predict(input: RawKinematicInput): KinematicPrediction {
    const { accelPeakG, accelJerk, speedDropDeltaKmH, gyroMagnitudeRadS } = input;
    const gyroJerk = input.gyroJerkRadS2 ?? gyroMagnitudeRadS * 1.5;
    const kineticFlux = accelPeakG * gyroMagnitudeRadS;

    // =========================================================================
    // DETERMINISTIC REAL-LIFE THRESHOLD RULES (PRD & User Specification)
    // =========================================================================

    // Rule A: Sudden drop in accelerometer and no gyro intensity break -> Obstacle faced
    const isRuleAObstacle =
      (accelJerk >= 18.0 || speedDropDeltaKmH >= 22.0) &&
      gyroMagnitudeRadS < 1.8;

    // Rule B: Accelerometer no intensity changes but gyro change obvious -> Heavy bump
    const isRuleBBump =
      speedDropDeltaKmH < 6.0 &&
      accelJerk <= 20.0 &&
      gyroMagnitudeRadS >= 2.8;

    // Rule C: Both intensity change -> Accident
    const isRuleCAccident =
      (accelJerk >= 25.0 || speedDropDeltaKmH >= 25.0 || accelPeakG >= 4.5) &&
      gyroMagnitudeRadS >= 4.2;

    if (isRuleCAccident) {
      return {
        predictedClass: 'POSSIBLE_ACCIDENT',
        confidence: Math.min(0.99, Math.max(0.75, (accelJerk + gyroMagnitudeRadS * 8) / 100)),
        probabilities: {
          NORMAL_DRIVING: 0.01,
          OBSTACLE_FACED: 0.04,
          HEAVY_BUMP: 0.05,
          POSSIBLE_ACCIDENT: 0.90,
        },
        ruleMatched: 'Rule C: Both accelerometer shock and violent gyro change detected',
      };
    }

    if (isRuleAObstacle) {
      return {
        predictedClass: 'OBSTACLE_FACED',
        confidence: Math.min(0.95, Math.max(0.70, (speedDropDeltaKmH + accelJerk) / 80)),
        probabilities: {
          NORMAL_DRIVING: 0.05,
          OBSTACLE_FACED: 0.85,
          HEAVY_BUMP: 0.05,
          POSSIBLE_ACCIDENT: 0.05,
        },
        ruleMatched: 'Rule A: Sudden drop in accelerometer with no gyro break (Obstacle Faced)',
      };
    }

    if (isRuleBBump) {
      return {
        predictedClass: 'HEAVY_BUMP',
        confidence: Math.min(0.92, Math.max(0.65, gyroMagnitudeRadS / 5.0)),
        probabilities: {
          NORMAL_DRIVING: 0.10,
          OBSTACLE_FACED: 0.05,
          HEAVY_BUMP: 0.82,
          POSSIBLE_ACCIDENT: 0.03,
        },
        ruleMatched: 'Rule B: Steady accelerometer with gyro rotational deflection (Heavy Bump)',
      };
    }

    // =========================================================================
    // NEURAL NETWORK FORWARD PASS (Trained VZCrash MLP Model)
    // =========================================================================
    const rawFeatures = [
      accelPeakG,
      accelJerk,
      speedDropDeltaKmH,
      gyroMagnitudeRadS,
      gyroJerk,
      kineticFlux,
    ];

    const { mean, std } = this.model.normalization;
    const normalized = rawFeatures.map((f, i) => (f - mean[i]) / (std[i] || 1));

    const layers = this.model.layers;
    const h1 = this.dense(normalized, layers.fc1.weights, layers.fc1.biases, 'relu');
    const h2 = this.dense(h1, layers.fc2.weights, layers.fc2.biases, 'relu');
    const probs = this.dense(h2, layers.fc3.weights, layers.fc3.biases, 'softmax');

    const classes: KinematicClass[] = [
      'NORMAL_DRIVING',
      'OBSTACLE_FACED',
      'HEAVY_BUMP',
      'POSSIBLE_ACCIDENT',
    ];

    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }

    const probabilities: Record<KinematicClass, number> = {
      NORMAL_DRIVING: Number(probs[0].toFixed(3)),
      OBSTACLE_FACED: Number(probs[1].toFixed(3)),
      HEAVY_BUMP: Number(probs[2].toFixed(3)),
      POSSIBLE_ACCIDENT: Number(probs[3].toFixed(3)),
    };

    return {
      predictedClass: classes[maxIdx],
      confidence: Number(probs[maxIdx].toFixed(2)),
      probabilities,
      ruleMatched: 'VZCrash Neural Network Inference',
    };
  }
}
