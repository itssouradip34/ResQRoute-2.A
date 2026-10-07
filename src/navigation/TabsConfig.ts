import {
  Activity,
  Bot,
  FileText,
  Home,
  ListOrdered,
  Settings,
  Users,
} from 'lucide-react-native';

export type TabType =
  | 'home'
  | 'services'
  | 'chat'
  | 'forensics'
  | 'sensor_lab'
  | 'contacts'
  | 'settings';

export interface TabDefinition {
  id: TabType;
  label_en: string;
  label_hi: string;
  icon: any;
  headerSubtitle?: string;
}

export const APP_TABS: TabDefinition[] = [
  {
    id: 'home',
    label_en: 'Rescue',
    label_hi: 'रेस्क्यू',
    icon: Home,
  },
  {
    id: 'services',
    label_en: 'Services',
    label_hi: 'सेवाएं',
    icon: ListOrdered,
    headerSubtitle: 'Nearby Emergency Directory',
  },
  {
    id: 'chat',
    label_en: 'AI Triage',
    label_hi: 'AI चैट',
    icon: Bot,
    headerSubtitle: 'AI Triage & Guidance',
  },
  {
    id: 'forensics',
    label_en: 'Forensics',
    label_hi: 'फॉरेंसिक',
    icon: FileText,
    headerSubtitle: 'Post-Accident Police Dossier',
  },
  {
    id: 'sensor_lab',
    label_en: 'Sensor Lab',
    label_hi: 'सेंसर लैब',
    icon: Activity,
    headerSubtitle: 'Kinematic Sensor Lab',
  },
  {
    id: 'contacts',
    label_en: 'Contacts',
    label_hi: 'संपर्क',
    icon: Users,
    headerSubtitle: 'Trusted Contacts & Tracking',
  },
  {
    id: 'settings',
    label_en: 'Settings',
    label_hi: 'सेटिंग्स',
    icon: Settings,
    headerSubtitle: 'Preferences & Storage',
  },
];

export const getTabSubtitle = (tabId: TabType): string | undefined => {
  const tab = APP_TABS.find((t) => t.id === tabId);
  return tab?.headerSubtitle;
};
