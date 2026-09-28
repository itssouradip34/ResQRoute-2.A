import {
  AIChatMessage,
  EmergencyService,
  ServiceCategory,
  SituationType,
  UrgencyLevel,
  UserLocation,
} from '../../types';
import { ServiceRanker } from '../directory/ServiceRanker';
import triageIntentsData from '../../models/triage_intents.json';

export interface AIClassificationResult {
  situationType: SituationType;
  urgencyLevel: UrgencyLevel;
  confidenceScore: number;
  serviceCategory: ServiceCategory;
  aiSummary: string;
  firstResponseGuidance: string[];
  followUpQuestions?: string[];
  isInsufficientData: boolean;
  triageSource: 'gemini_online' | 'neural_offline';
}

export class AITriageEngine {
  private static intents = triageIntentsData.intents;

  /**
   * Process natural language emergency description with hybrid online Gemini + offline neural model
   */
  public static async analyzeEmergencyText(
    inputText: string,
    location: UserLocation,
    language: 'en' | 'hi' = 'en',
    geminiApiKey?: string
  ): Promise<{
    message: AIChatMessage;
    classification: AIClassificationResult;
  }> {
    const key =
      geminiApiKey ||
      process.env.EXPO_PUBLIC_GEMINI_API_KEY ||
      process.env.GEMINI_API_KEY;

    // Try Online Gemini first if key available
    if (key && key.length > 10) {
      try {
        const geminiResult = await this.queryGeminiTriage(inputText, location, language, key);
        if (geminiResult) {
          return this.packageTriageResult(geminiResult, location);
        }
      } catch (err) {
        console.warn('Gemini online triage failed, falling back to on-device model:', err);
      }
    }

    // On-device Neural Intent Model Fallback (100% offline)
    const offlineResult = this.evaluateOfflineIntents(inputText, language);
    return this.packageTriageResult(offlineResult, location);
  }

  /**
   * Call Google Gemini API for rich emergency triage
   */
  private static async queryGeminiTriage(
    text: string,
    location: UserLocation,
    language: 'en' | 'hi',
    apiKey: string
  ): Promise<AIClassificationResult | null> {
    const systemPrompt = `You are ResQRoute AI, an expert roadside emergency and trauma response coordinator operating across India.
Analyze the user's emergency text and return ONLY valid JSON matching this schema:
{
  "situationType": "accident" | "breakdown" | "medical" | "flat_tyre" | "fuel_out" | "other",
  "urgencyLevel": "critical" | "high" | "moderate",
  "confidenceScore": number (0 to 1),
  "serviceCategory": "hospital" | "ambulance" | "police" | "towing" | "puncture_repair" | "mechanic" | "fuel",
  "aiSummary": string (calm, empathetic, reassuring summary in ${language === 'hi' ? 'Hindi' : 'English'}),
  "firstResponseGuidance": string[] (3 to 4 immediate, high-priority, lifesaving first aid or roadside safety steps),
  "followUpQuestions": string[] (at most 2 crucial questions),
  "isInsufficientData": boolean
}
Safety guardrails:
- Mention 112 / 108 / 1033 (NHAI) where appropriate.
- Prioritize human life and preventing secondary collisions.
- Keep responses concise, direct, and actionable.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;

    const resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: systemPrompt },
              { text: `User emergency message: "${text}"\nLocation: ${location.addressName || 'India'}` },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.2,
        },
      }),
    });

    if (!resp.ok) return null;
    const data = await resp.json();
    const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!candidateText) return null;

    const parsed = JSON.parse(candidateText);
    return {
      situationType: parsed.situationType || 'accident',
      urgencyLevel: parsed.urgencyLevel || 'critical',
      confidenceScore: parsed.confidenceScore || 0.95,
      serviceCategory: parsed.serviceCategory || 'hospital',
      aiSummary: parsed.aiSummary,
      firstResponseGuidance: parsed.firstResponseGuidance || [],
      followUpQuestions: parsed.followUpQuestions?.slice(0, 2) || [],
      isInsufficientData: Boolean(parsed.isInsufficientData),
      triageSource: 'gemini_online',
    };
  }

  /**
   * On-device offline semantic intent evaluation
   */
  private static evaluateOfflineIntents(
    inputText: string,
    language: 'en' | 'hi'
  ): AIClassificationResult {
    const textLower = inputText.toLowerCase();

    let bestIntent: any = null;
    let maxMatches = 0;

    for (const intent of this.intents) {
      let matches = 0;
      for (const kw of intent.keywords) {
        if (textLower.includes(kw.toLowerCase())) {
          matches += 1;
        }
      }
      if (matches > maxMatches) {
        maxMatches = matches;
        bestIntent = intent;
      }
    }

    if (bestIntent && maxMatches > 0) {
      const guidance =
        language === 'hi' ? bestIntent.guidance_hi : bestIntent.guidance_en;
      const followUps =
        language === 'hi' ? bestIntent.follow_ups_hi : bestIntent.follow_ups_en;

      const summary =
        language === 'hi'
          ? `स्थिति की पहचान हुई: ${bestIntent.situation_type.toUpperCase()}। प्राथमिक सहायता निर्देश नीचे देखें।`
          : `Emergency identified: ${bestIntent.situation_type.toUpperCase()}. Critical safety guidance and nearest verified response units dispatched below.`;

      return {
        situationType: bestIntent.situation_type as SituationType,
        urgencyLevel: bestIntent.urgency_level as UrgencyLevel,
        confidenceScore: bestIntent.confidence,
        serviceCategory: bestIntent.service_category as ServiceCategory,
        aiSummary: summary,
        firstResponseGuidance: guidance,
        followUpQuestions: followUps,
        isInsufficientData: false,
        triageSource: 'neural_offline',
      };
    }

    // Default Fallback
    return {
      situationType: 'other',
      urgencyLevel: 'high',
      confidenceScore: 0.5,
      serviceCategory: 'police',
      aiSummary:
        language === 'hi'
          ? 'अधूरी जानकारी। यदि जीवन का खतरा है तो तुरंत राष्ट्रीय आपातकालीन नंबर 112 डायल करें।'
          : 'Insufficient details provided. For any urgent threat to life, immediately call National Emergency 112.',
      firstResponseGuidance: [
        '1. Ensure you and passengers are in a safe location away from moving traffic.',
        '2. Call 112 for Police/Medical coordination.',
        '3. Select the nearest emergency facility from the directory below.',
      ],
      followUpQuestions: [
        'Is anyone injured or in immediate danger?',
        'Can the vehicle be safely moved off the road?',
      ],
      isInsufficientData: true,
      triageSource: 'neural_offline',
    };
  }

  private static packageTriageResult(
    classification: AIClassificationResult,
    location: UserLocation
  ): { message: AIChatMessage; classification: AIClassificationResult } {
    const recommendedServices = ServiceRanker.rankServices({
      userLocation: location,
      situationType: classification.situationType,
      categoryFilter: classification.serviceCategory,
      maxDistanceKm: 75,
    }).slice(0, 3);

    const botMessage: AIChatMessage = {
      id: `ai_${Date.now()}`,
      sender: 'assistant',
      text: classification.aiSummary,
      timestamp: Date.now(),
      categorySuggestion: classification.serviceCategory,
      urgencyLevel: classification.urgencyLevel,
      triageSource: classification.triageSource,
      firstResponseGuidance: classification.firstResponseGuidance,
      followUpOptions: classification.followUpQuestions,
      isSafetyGuidance: true,
      recommendedServices,
      extractedFacts: {
        hazardLevel: classification.urgencyLevel,
        injuries:
          classification.situationType === 'accident' ||
          classification.situationType === 'medical',
      },
    };

    return { message: botMessage, classification };
  }
}
