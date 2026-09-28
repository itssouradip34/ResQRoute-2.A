import acousticModelData from '../../models/acoustic_model.json';

export type AcousticClass = 'NORMAL_VEHICLE' | 'TIRE_SKID_SCREECH' | 'CRASH_IMPACT';

export interface AcousticFrame {
  timestamp: number;
  rmsEnergyDb: number;
  spectralCentroidHz: number;
  spectralFlux: number;
  zeroCrossingRate: number;
  lowBandEnergy: number;
  midBandEnergy: number;
  highBandEnergy: number;
  crestFactor: number;
}

export interface AcousticDetectionResult {
  predictedClass: AcousticClass;
  confidenceScore: number;
  probabilities: Record<AcousticClass, number>;
  isCrashEvent: boolean;
  requiresSOS: boolean;
  reasoning: string;
}

export type AcousticListener = (result: AcousticDetectionResult, frame: AcousticFrame) => void;

class AudioCrashDetectorService {
  private isListening = false;
  private isConsentGranted = false;
  private listeners: Set<AcousticListener> = new Set();
  private cooldownUntil = 0;
  private model = acousticModelData;

  public setConsentGranted(granted: boolean) {
    this.isConsentGranted = granted;
    if (!granted && this.isListening) {
      this.stopMonitoring();
    }
  }

  public getConsentGranted(): boolean {
    return this.isConsentGranted;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  /**
   * Start listening only if user has explicitly granted permit
   */
  public async startMonitoring(): Promise<{ started: boolean; error?: string }> {
    if (!this.isConsentGranted) {
      return {
        started: false,
        error: 'User permission / consent required before enabling acoustic crash monitoring.',
      };
    }

    this.isListening = true;
    return { started: true };
  }

  public stopMonitoring() {
    this.isListening = false;
  }

  public subscribe(listener: AcousticListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private relu(x: number): number {
    return Math.max(0, x);
  }

  private softmax(logits: number[]): number[] {
    const maxVal = Math.max(...logits);
    const expVals = logits.map((v) => Math.exp(v - maxVal));
    const sumExp = expVals.reduce((a, b) => a + b, 0);
    return expVals.map((v) => v / (sumExp || 1));
  }

  private dense(
    inputs: number[],
    weights: number[][],
    biases: number[],
    activation: 'relu' | 'softmax'
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
   * Evaluate raw acoustic frame using the trained neural network (zero .pt)
   */
  public evaluateFrame(frame: AcousticFrame): AcousticDetectionResult {
    const rawFeatures = [
      frame.rmsEnergyDb,
      frame.spectralCentroidHz,
      frame.spectralFlux,
      frame.zeroCrossingRate,
      frame.lowBandEnergy,
      frame.midBandEnergy,
      frame.highBandEnergy,
      frame.crestFactor,
    ];

    const { mean, std } = this.model.normalization;
    const normalized = rawFeatures.map((f, i) => (f - mean[i]) / (std[i] || 1));

    const layers = this.model.layers;
    const h1 = this.dense(normalized, layers.fc1.weights, layers.fc1.biases, 'relu');
    const h2 = this.dense(h1, layers.fc2.weights, layers.fc2.biases, 'relu');
    const probs = this.dense(h2, layers.fc3.weights, layers.fc3.biases, 'softmax');

    const classes: AcousticClass[] = [
      'NORMAL_VEHICLE',
      'TIRE_SKID_SCREECH',
      'CRASH_IMPACT',
    ];

    let maxIdx = 0;
    for (let i = 1; i < probs.length; i++) {
      if (probs[i] > probs[maxIdx]) maxIdx = i;
    }

    const predictedClass = classes[maxIdx];
    const confidenceScore = Number(probs[maxIdx].toFixed(2));
    const isCrashEvent = predictedClass === 'CRASH_IMPACT' && confidenceScore >= 0.70;
    const isSkidEvent = predictedClass === 'TIRE_SKID_SCREECH' && confidenceScore >= 0.70;

    let reasoning = 'Normal vehicle cabin and ambient traffic audio';
    if (isCrashEvent) {
      reasoning = `High-energy metal collision/glass breakage acoustic signature detected (${(confidenceScore * 100).toFixed(0)}% confidence). SOS rescue recommended.`;
    } else if (isSkidEvent) {
      reasoning = `High-frequency tire friction / skidding acoustic detected (${(confidenceScore * 100).toFixed(0)}% confidence). Potential pre-crash event.`;
    }

    const result: AcousticDetectionResult = {
      predictedClass,
      confidenceScore,
      probabilities: {
        NORMAL_VEHICLE: Number(probs[0].toFixed(3)),
        TIRE_SKID_SCREECH: Number(probs[1].toFixed(3)),
        CRASH_IMPACT: Number(probs[2].toFixed(3)),
      },
      isCrashEvent,
      requiresSOS: isCrashEvent,
      reasoning,
    };

    const now = Date.now();
    if (isCrashEvent && now > this.cooldownUntil) {
      this.cooldownUntil = now + 15000;
      this.listeners.forEach((listener) => listener(result, frame));
    }

    return result;
  }

  /**
   * Simulation studio method for live lab testing
   */
  public simulateAcousticEvent(scenario: 'normal' | 'skid' | 'crash'): AcousticDetectionResult {
    let frame: AcousticFrame;

    if (scenario === 'crash') {
      frame = {
        timestamp: Date.now(),
        rmsEnergyDb: -2.5,
        spectralCentroidHz: 3200,
        spectralFlux: 1.85,
        zeroCrossingRate: 0.55,
        lowBandEnergy: 0.88,
        midBandEnergy: 0.79,
        highBandEnergy: 0.82,
        crestFactor: 14.5,
      };
    } else if (scenario === 'skid') {
      frame = {
        timestamp: Date.now(),
        rmsEnergyDb: -12.0,
        spectralCentroidHz: 3900,
        spectralFlux: 0.55,
        zeroCrossingRate: 0.42,
        lowBandEnergy: 0.22,
        midBandEnergy: 0.50,
        highBandEnergy: 0.88,
        crestFactor: 6.2,
      };
    } else {
      frame = {
        timestamp: Date.now(),
        rmsEnergyDb: -32.0,
        spectralCentroidHz: 950,
        spectralFlux: 0.15,
        zeroCrossingRate: 0.06,
        lowBandEnergy: 0.65,
        midBandEnergy: 0.35,
        highBandEnergy: 0.12,
        crestFactor: 3.1,
      };
    }

    return this.evaluateFrame(frame);
  }
}

export const AudioCrashDetector = new AudioCrashDetectorService();
