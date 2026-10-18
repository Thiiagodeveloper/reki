import AsyncStorage from '@react-native-async-storage/async-storage';

const XP_KEY = 'reki_xp_data';

export interface XpData {
  totalXp: number;
  level: number;
  todayXp: number;
  lastStudyDate: string;
  streak: number;
  achievements: string[];
}

const XP_PER_CARD = 10;
const XP_BONUS_CORRECT = 5;
const XP_PER_LEVEL = 100;

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  condition: (data: XpData) => boolean;
}

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_card',
    title: 'First Step',
    description: 'Study your first card',
    icon: '🎯',
    condition: (d) => d.totalXp >= XP_PER_CARD,
  },
  {
    id: 'level_5',
    title: 'Getting Started',
    description: 'Reach level 5',
    icon: '⭐',
    condition: (d) => d.level >= 5,
  },
  {
    id: 'level_10',
    title: 'Dedicated',
    description: 'Reach level 10',
    icon: '🌟',
    condition: (d) => d.level >= 10,
  },
  {
    id: 'level_25',
    title: 'Scholar',
    description: 'Reach level 25',
    icon: '🎓',
    condition: (d) => d.level >= 25,
  },
  {
    id: 'streak_3',
    title: 'On Fire',
    description: '3 day streak',
    icon: '🔥',
    condition: (d) => d.streak >= 3,
  },
  {
    id: 'streak_7',
    title: 'Unstoppable',
    description: '7 day streak',
    icon: '💪',
    condition: (d) => d.streak >= 7,
  },
  {
    id: 'streak_30',
    title: 'Legendary',
    description: '30 day streak',
    icon: '👑',
    condition: (d) => d.streak >= 30,
  },
  {
    id: 'xp_1000',
    title: 'Thousand Club',
    description: 'Earn 1,000 XP',
    icon: '💎',
    condition: (d) => d.totalXp >= 1000,
  },
  {
    id: 'xp_5000',
    title: 'XP Master',
    description: 'Earn 5,000 XP',
    icon: '🏆',
    condition: (d) => d.totalXp >= 5000,
  },
  {
    id: 'daily_50',
    title: 'Power Session',
    description: 'Earn 50+ XP in one day',
    icon: '⚡',
    condition: (d) => d.todayXp >= 50,
  },
];

export async function getXpData(): Promise<XpData> {
  const raw = await AsyncStorage.getItem(XP_KEY);
  if (!raw) {
    return {
      totalXp: 0,
      level: 1,
      todayXp: 0,
      lastStudyDate: '',
      streak: 0,
      achievements: [],
    };
  }
  const data: XpData = JSON.parse(raw);
  const today = new Date().toISOString().split('T')[0];
  if (data.lastStudyDate !== today) {
    data.todayXp = 0;
  }
  return data;
}

export async function addXp(
  cardsStudied: number,
  cardsCorrect: number,
): Promise<{ xpGained: number; newAchievements: Achievement[]; data: XpData }> {
  const data = await getXpData();
  const today = new Date().toISOString().split('T')[0];

  const xpGained = cardsStudied * XP_PER_CARD + cardsCorrect * XP_BONUS_CORRECT;
  data.totalXp += xpGained;
  data.todayXp += xpGained;
  data.level = Math.floor(data.totalXp / XP_PER_LEVEL) + 1;

  if (data.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    if (data.lastStudyDate === yesterdayStr) {
      data.streak += 1;
    } else if (data.lastStudyDate !== today) {
      data.streak = 1;
    }
    data.lastStudyDate = today;
  }

  const newAchievements: Achievement[] = [];
  for (const achievement of ACHIEVEMENTS) {
    if (!data.achievements.includes(achievement.id) && achievement.condition(data)) {
      data.achievements.push(achievement.id);
      newAchievements.push(achievement);
    }
  }

  await AsyncStorage.setItem(XP_KEY, JSON.stringify(data));

  return { xpGained, newAchievements, data };
}

export function getXpForNextLevel(data: XpData): {
  current: number;
  needed: number;
  progress: number;
} {
  const currentLevelXp = (data.level - 1) * XP_PER_LEVEL;
  const current = data.totalXp - currentLevelXp;
  return {
    current,
    needed: XP_PER_LEVEL,
    progress: current / XP_PER_LEVEL,
  };
}
