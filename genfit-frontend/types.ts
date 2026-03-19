export interface NutritionData {
  foodName: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  summary: string;
  timestamp: Date;
}

export interface ActivityData {
  id: string;
  type: string;
  durationMinutes: number;
  caloriesBurned: number;
  intensity: 'Low' | 'Medium' | 'High';
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}

export interface DailyStats {
  steps: number;
  stepsGoal: number;
  caloriesIn: number;
  caloriesOut: number;
  calorieGoal: number;
  waterMl: number;
  waterTarget: number;
  sleepHours: number;
}

export type Theme = 'pink' | 'blue';

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  NUTRITION = 'NUTRITION',
  ACTIVITY = 'ACTIVITY',
  COACH = 'COACH',
  BODY_BLUEPRINT = 'BODY_BLUEPRINT',
  PROFILE = 'PROFILE',
  SETTINGS = 'SETTINGS'
}

export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very_active';

export interface BodyProfile {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  activityLevel: ActivityLevel;
}