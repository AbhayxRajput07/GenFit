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
  caloriesIn: number;
  caloriesOut: number;
  waterMl: number;
  sleepHours: number;
}

export enum ViewState {
  DASHBOARD = 'DASHBOARD',
  NUTRITION = 'NUTRITION',
  ACTIVITY = 'ACTIVITY',
  COACH = 'COACH'
}
