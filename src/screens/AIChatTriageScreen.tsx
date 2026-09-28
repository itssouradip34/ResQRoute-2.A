import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  AlertCircle,
  Bot,
  Cpu,
  Flame,
  HelpCircle,
  Lightbulb,
  Send,
  ShieldCheck,
  Sparkles,
  User,
} from 'lucide-react-native';
import { AIChatMessage, SituationType } from '../types';
import { useEmergency } from '../context/EmergencyContext';
import { useSettings } from '../context/SettingsContext';
import { AITriageEngine } from '../services/ai/AITriageEngine';
import { ServiceCard } from '../components/ServiceCard';

interface AIChatTriageScreenProps {
  initialSituation?: SituationType;
}

export const AIChatTriageScreen: React.FC<AIChatTriageScreenProps> = ({
  initialSituation,
}) => {
  const { userLocation } = useEmergency();
  const { settings } = useSettings();

  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const quickPrompts = [
    {
      label_en: '🚗 Two car collision on highway',
      label_hi: '🚗 हाईवे पर दो कारों की टक्कर',
      text: 'Two cars collided on the highway, driver in the other car is bleeding.',
    },
    {
      label_en: '🛞 Flat tyre at night',
      label_hi: '🛞 रात में टायर पंचर हो गया',
      text: 'Got a flat tyre on the expressway at night, need mobile puncture repair.',
    },
    {
      label_en: '⚠️ Engine smoke & breakdown',
      label_hi: '⚠️ इंजन से धुआं और ब्रेकडाउन',
      text: 'Car engine stopped with heavy smoke, need a towing crane immediately.',
    },
    {
      label_en: '🩺 Passenger severe chest pain',
      label_hi: '🩺 यात्री को तेज सीने में दर्द',
      text: 'Passenger is having severe chest pain and difficulty breathing.',
    },
  ];

  useEffect(() => {
    // Initial welcome message
    const welcomeMsg: AIChatMessage = {
      id: 'welcome',
      sender: 'assistant',
      text:
        settings.language === 'hi'
          ? 'नमस्ते! मैं ResQRoute-A आपातकालीन AI सहायक हूँ। आप अपनी आपात स्थिति बोलकर या लिखकर बताएं। मैं तुरंत निकटतम उपयुक्त सेवाएं व सुरक्षा निर्देश उपलब्ध कराऊंगा।'
          : "Hello! I am your ResQRoute-A Emergency AI Assistant. Describe what happened in plain words and I'll immediately triage your situation and surface the closest help.",
      timestamp: Date.now(),
      isSafetyGuidance: true,
      followUpOptions: [
        settings.language === 'hi'
          ? 'क्या कोई व्यक्ति घायल है?'
          : 'Is anyone injured or in immediate danger?',
        settings.language === 'hi'
          ? 'क्या आपको टोइंग या मैकेनिक चाहिए?'
          : 'Do you need medical rescue or roadside towing?',
      ],
    };

    setMessages([welcomeMsg]);

    if (initialSituation) {
      handleSendSituation(initialSituation);
    }
  }, [settings.language]);

  const handleSendSituation = async (situation: SituationType) => {
    const textMap: Record<SituationType, string> = {
      accident: 'I was in a road collision, need help',
      breakdown: 'Vehicle broke down and is not moving',
      medical: 'Medical emergency with passenger',
      flat_tyre: 'Tyre punctured on the road',
      fuel_out: 'Ran out of fuel on highway',
      other: 'Need urgent emergency assistance',
    };
    await processUserMessage(textMap[situation]);
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    setInput('');
    await processUserMessage(userText);
  };

  const processUserMessage = async (userText: string) => {
    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate realistic AI triage turnaround
    setTimeout(async () => {
      const { message } = await AITriageEngine.analyzeEmergencyText(
        userText,
        userLocation,
        settings.language
      );

      setMessages((prev) => [...prev, message]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Non-Medical Disclaimer Header */}
      <View style={styles.disclaimerBanner}>
        <AlertCircle size={14} color="#FFA500" />
        <Text style={styles.disclaimerText}>
          {settings.language === 'hi'
            ? 'AI द्वारा सहायता प्राप्त। यह चिकित्सीय/कानूनी सलाह नहीं है। जान के खतरे में 112/108 डायल करें।'
            : 'AI-assisted triage. Not a medical diagnosis. Dial 112 / 108 for life-threatening crisis.'}
        </Text>
      </View>

      {/* Messages Stream */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContent}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
        renderItem={({ item }) => {
          const isBot = item.sender === 'assistant';
          return (
            <View
              style={[
                styles.messageBubble,
                isBot ? styles.bubbleBot : styles.bubbleUser,
              ]}
            >
              {/* Sender Badge & Engine Source */}
              <View style={styles.bubbleHeader}>
                <View style={styles.senderInfoRow}>
                  {isBot ? (
                    <Bot size={16} color="#58A6FF" />
                  ) : (
                    <User size={16} color="#3FB950" />
                  )}
                  <Text style={styles.bubbleSenderName}>
                    {isBot ? 'ResQRoute AI' : 'You'}
                  </Text>
                </View>

                {/* Model Engine Tag */}
                {isBot && item.triageSource && (
                  <View
                    style={[
                      styles.engineBadge,
                      item.triageSource === 'gemini_online'
                        ? styles.engineBadgeOnline
                        : styles.engineBadgeOffline,
                    ]}
                  >
                    {item.triageSource === 'gemini_online' ? (
                      <>
                        <Sparkles size={11} color="#A371F7" />
                        <Text style={styles.engineBadgeTextOnline}>Gemini 2.0 Online</Text>
                      </>
                    ) : (
                      <>
                        <Cpu size={11} color="#3FB950" />
                        <Text style={styles.engineBadgeTextOffline}>Neural Offline</Text>
                      </>
                    )}
                  </View>
                )}

                {/* Urgency Badge */}
                {isBot && item.urgencyLevel && (
                  <View
                    style={[
                      styles.urgencyBadge,
                      item.urgencyLevel === 'critical'
                        ? styles.urgencyCritical
                        : item.urgencyLevel === 'high'
                        ? styles.urgencyHigh
                        : styles.urgencyModerate,
                    ]}
                  >
                    <Text style={styles.urgencyText}>
                      {item.urgencyLevel.toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Message Text */}
              <Text style={styles.bubbleText}>{item.text}</Text>

              {/* First-Response Lifesaving Guidance Steps */}
              {item.firstResponseGuidance && item.firstResponseGuidance.length > 0 && (
                <View style={styles.guidanceBox}>
                  <View style={styles.guidanceHeader}>
                    <ShieldCheck size={14} color="#3FB950" />
                    <Text style={styles.guidanceTitle}>
                      {settings.language === 'hi'
                        ? '🚨 तत्काल जीवन रक्षक कदम (First Response Steps):'
                        : '🚨 Immediate Lifesaving First Response Steps:'}
                    </Text>
                  </View>
                  {item.firstResponseGuidance.map((step: string, sIdx: number) => (
                    <View key={sIdx} style={styles.guidanceStepRow}>
                      <Text style={styles.guidanceStepBullet}>•</Text>
                      <Text style={styles.guidanceStepText}>{step}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Follow-up / Clarifying Questions Chips */}
              {item.followUpOptions && item.followUpOptions.length > 0 && (
                <View style={styles.followUpContainer}>
                  <Text style={styles.followUpHeader}>
                    {settings.language === 'hi'
                      ? 'त्वरित प्रतिक्रिया विकल्प:'
                      : 'Clarifying questions / Quick replies:'}
                  </Text>
                  {item.followUpOptions.map((opt: string, idx: number) => (
                    <TouchableOpacity
                      key={idx}
                      style={styles.followUpChip}
                      activeOpacity={0.7}
                      onPress={() => processUserMessage(opt)}
                    >
                      <HelpCircle size={14} color="#58A6FF" />
                      <Text style={styles.followUpText}>{opt}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Inline Recommended Services */}
              {item.recommendedServices &&
                item.recommendedServices.length > 0 && (
                  <View style={styles.inlineServicesContainer}>
                    <Text style={styles.inlineServicesHeader}>
                      {settings.language === 'hi'
                        ? 'अनुशंसित आपातकालीन सेवाएं:'
                        : 'Recommended Nearest Services:'}
                    </Text>
                    {item.recommendedServices.map((svc: any) => (
                      <ServiceCard key={svc.id} service={svc} />
                    ))}
                  </View>
                )}
            </View>
          );
        }}
      />

      {/* Typing Indicator */}
      {isTyping && (
        <View style={styles.typingContainer}>
          <Bot size={14} color="#8B949E" />
          <Text style={styles.typingText}>
            {settings.language === 'hi'
              ? 'AI स्थिति का विश्लेषण कर रहा है...'
              : 'AI is analyzing situation & prioritizing help...'}
          </Text>
        </View>
      )}

      {/* Quick Prompts Carousel */}
      <View style={styles.quickPromptsWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickPromptsContent}
        >
          {quickPrompts.map((p, idx) => (
            <TouchableOpacity
              key={idx}
              style={styles.quickPromptChip}
              activeOpacity={0.7}
              onPress={() => processUserMessage(p.text)}
            >
              <Text style={styles.quickPromptText}>
                {settings.language === 'hi' ? p.label_hi : p.label_en}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Input Bar */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          placeholder={
            settings.language === 'hi'
              ? 'अपनी स्थिति यहाँ लिखें...'
              : 'Describe what happened (e.g. flat tyre, crash)...'
          }
          placeholderTextColor="#6E7681"
          value={input}
          onChangeText={setInput}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            !input.trim() && styles.sendButtonDisabled,
          ]}
          activeOpacity={0.8}
          disabled={!input.trim() || isTyping}
          onPress={handleSend}
        >
          <Send size={18} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 165, 0, 0.12)',
    borderColor: 'rgba(255, 165, 0, 0.3)',
    borderBottomWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  disclaimerText: {
    color: '#FFA500',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  messagesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 20,
  },
  messageBubble: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    maxWidth: '92%',
  },
  bubbleBot: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  bubbleUser: {
    backgroundColor: '#1F6FEB',
    alignSelf: 'flex-end',
  },
  bubbleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  senderInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  engineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  engineBadgeOnline: {
    backgroundColor: 'rgba(163, 113, 247, 0.15)',
    borderColor: 'rgba(163, 113, 247, 0.4)',
  },
  engineBadgeOffline: {
    backgroundColor: 'rgba(63, 185, 80, 0.15)',
    borderColor: 'rgba(63, 185, 80, 0.4)',
  },
  engineBadgeTextOnline: {
    color: '#D2A8FF',
    fontSize: 10,
    fontWeight: '700',
  },
  engineBadgeTextOffline: {
    color: '#7EE787',
    fontSize: 10,
    fontWeight: '700',
  },
  urgencyBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  urgencyCritical: {
    backgroundColor: 'rgba(248, 81, 73, 0.25)',
  },
  urgencyHigh: {
    backgroundColor: 'rgba(255, 165, 0, 0.25)',
  },
  urgencyModerate: {
    backgroundColor: 'rgba(210, 153, 34, 0.25)',
  },
  urgencyText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  guidanceBox: {
    backgroundColor: 'rgba(63, 185, 80, 0.08)',
    borderColor: 'rgba(63, 185, 80, 0.3)',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
    marginBottom: 4,
  },
  guidanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  guidanceTitle: {
    color: '#7EE787',
    fontSize: 12,
    fontWeight: '700',
  },
  guidanceStepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    marginBottom: 4,
  },
  guidanceStepBullet: {
    color: '#3FB950',
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  guidanceStepText: {
    color: '#E6EDF3',
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
  bubbleSenderName: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
  },
  bubbleText: {
    color: '#F0F6FC',
    fontSize: 14,
    lineHeight: 20,
  },
  followUpContainer: {
    marginTop: 12,
    gap: 8,
  },
  followUpHeader: {
    color: '#8B949E',
    fontSize: 11,
    fontWeight: '700',
  },
  followUpChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0D1117',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  followUpText: {
    color: '#58A6FF',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  inlineServicesContainer: {
    marginTop: 14,
  },
  inlineServicesHeader: {
    color: '#F0F6FC',
    fontSize: 13,
    fontWeight: '800',
    marginBottom: 8,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 6,
  },
  typingText: {
    color: '#8B949E',
    fontSize: 12,
    fontStyle: 'italic',
  },
  quickPromptsWrapper: {
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#21262D',
  },
  quickPromptsContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickPromptChip: {
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  quickPromptText: {
    color: '#C9D1D9',
    fontSize: 12,
    fontWeight: '600',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#0D1117',
    borderTopWidth: 1,
    borderTopColor: '#21262D',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: '#161B22',
    borderColor: '#30363D',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    height: 44,
    color: '#FFFFFF',
    fontSize: 14,
  },
  sendButton: {
    backgroundColor: '#238636',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: '#21262D',
  },
});
