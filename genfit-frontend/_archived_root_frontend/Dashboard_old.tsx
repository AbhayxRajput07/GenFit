import React, { useState, useEffect } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  Label
} from 'recharts';
import { DailyStats, ActivityData, NutritionData } from '../types';
import { Flame, Footprints, Moon, Heart, Activity, Edit, X } from 'lucide-react';
import { motion } from 'framer-motion';

interface DashboardProps {
  stats: DailyStats;
  activities: ActivityData[];
  nutrition: NutritionData[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, activities, nutrition }) => {

  const [goals, setGoals] = useState(() => {
    const saved = localStorage.getItem('fitnessGoals');
    return saved
      ? JSON.parse(saved)
      : { steps: 10000, calories: 800, sleep: 8, heart: 80 };
  });

  const [editing, setEditing] = useState(false);

  useEffect(() => {
    localStorage.setItem('fitnessGoals', JSON.stringify(goals));
  }, [goals]);

  const weightData = [
    { day: 'Mon', weight: 70.2 },
    { day: 'Tue', weight: 70.1 },
    { day: 'Wed', weight: 69.9 },
    { day: 'Thu', weight: 69.8 },
    { day: 'Fri', weight: 69.6 },
    { day: 'Sat', weight: 69.5 },
    { day: 'Sun', weight: 69.3 },
  ];

  const macroData = nutrition.length
    ? [
        { name: 'Protein', value: nutrition.reduce((a, b) => a + b.protein, 0) },
        { name: 'Carbs', value: nutrition.reduce((a, b) => a + b.carbs, 0) },
        { name: 'Fats', value: nutrition.reduce((a, b) => a + b.fats, 0) },
      ]
    : [
        { name: 'Protein', value: 120 },
        { name: 'Carbs', value: 180 },
        { name: 'Fats', value: 65 },
      ];

  const COLORS = ['#f472b6', '#fb7185', '#f9a8d4'];

  const StatCard = ({ title, value, unit, goal, icon: Icon }: any) => {
    const percent = Math.min((value / goal) * 100, 100);

    return (
      <motion.div
        whileHover={{ y: -4 }}
        className="rounded-3xl bg-white shadow-xl p-6 border border-black/20"
      >
        <div className="flex justify-between items-start">
          <div>
            <p className="text-gray-500 text-sm">{title}</p>
            <h3 className="text-3xl font-semibold text-black">
              {value} <span className="text-sm">{unit}</span>
            </h3>
            <p className="text-xs text-gray-500">
              Goal: {goal} {unit}
            </p>
          </div>

          <div className="p-3 rounded-xl bg-pink-100 border border-black/20">
            <Icon />
          </div>
        </div>

        <div className="h-2 bg-gray-200 rounded mt-4">
          <div
            className="h-full bg-pink-400 rounded"
            style={{ width: `${percent}%` }}
          />
        </div>
      </motion.div>
    );
  };

  return (
    <div className="w-full min-h-screen px-16 py-12 space-y-16 bg-gradient-to-br from-white via-rose-50 to-pink-100 text-black">

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-4xl font-semibold">Health Dashboard</h2>
          <p className="text-gray-500">AI powered wellness overview</p>
        </div>

        <button
          onClick={() => setEditing(true)}
          className="p-3 rounded-xl bg-pink-200 border border-black/20 hover:bg-pink-300"
        >
          <Edit />
        </button>
      </div>

      {/* Stats */}
      <div className="grid md:grid-cols-4 gap-10">
        <StatCard title="Steps" value={stats.steps} unit="steps" goal={goals.steps} icon={Footprints} />
        <StatCard title="Calories" value={stats.caloriesOut} unit="kcal" goal={goals.calories} icon={Flame} />
        <StatCard title="Sleep" value={stats.sleepHours} unit="hrs" goal={goals.sleep} icon={Moon} />
        <StatCard title="Heart" value={72} unit="bpm" goal={goals.heart} icon={Heart} />
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-12 w-full">

        {/* Weight Chart */}
        <div className="lg:col-span-2 bg-white rounded-3xl shadow-xl p-10 border border-black/20 relative">
          <span className="absolute top-6 right-6 text-xs bg-pink-100 px-3 py-1 rounded-full border border-black/20">
            Weight Trend (kg)
          </span>

          <h3 className="mb-6 font-medium text-lg">Weight Progress</h3>

          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weightData}>
              <defs>
                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f472b6" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid stroke="#fbcfe8" strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis />

              <Tooltip
                contentStyle={{
                  background: '#fff',
                  borderRadius: '10px',
                  border: '1px solid #000'
                }}
              />

              <Area
                type="monotone"
                dataKey="weight"
                stroke="#f472b6"
                fill="url(#weightGradient)"
                strokeWidth={3}
              >
                <Label value="Weight" position="top" fill="black" />
              </Area>
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Macro Chart */}
        <div className="bg-white rounded-3xl shadow-xl p-10 border border-black/20">
          <h3 className="mb-6 font-medium text-lg">Nutrition Breakdown</h3>

          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={macroData}
                innerRadius={70}
                outerRadius={100}
                dataKey="value"
                label={({ name }) => name}
              >
                {macroData.map((entry, index) => (
                  <Cell key={index} fill={COLORS[index]} />
                ))}
              </Pie>

              <Legend wrapperStyle={{ color: 'black' }} />
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Activities */}
      <div className="bg-white rounded-3xl shadow-xl p-10 border border-black/20">
        <h3 className="mb-6 font-medium text-lg">Recent Activities</h3>

        {activities.length === 0 ? (
          <p className="text-gray-400">No activities logged yet.</p>
        ) : (
          activities.map(a => (
            <div
              key={a.id}
              className="flex justify-between items-center border-b border-black/10 py-4"
            >
              <div className="flex items-center gap-3">
                <Activity />
                <span>{a.type}</span>
              </div>
              <div className="text-sm">
                {a.durationMinutes} min ΓÇó {a.caloriesBurned} kcal
              </div>
            </div>
          ))
        )}
      </div>

      {/* Goals Modal */}
      {editing && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-50">
          <div className="bg-white p-8 rounded-3xl border border-black/20 space-y-6 w-[420px] relative">

            {/* Header with close */}
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-semibold">
                ≡ƒÄ» Set Your Fitness Goals
              </h3>

              <button
                onClick={() => setEditing(false)}
                className="p-2 rounded-lg hover:bg-pink-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Inputs */}
            {[
              ['≡ƒæƒ Daily Steps Target', 'steps'],
              ['≡ƒöÑ Calories Burn Goal (kcal)', 'calories'],
              ['≡ƒîÖ Sleep Goal (hrs)', 'sleep'],
              ['Γ¥ñ∩╕Å Heart Rate Goal (bpm)', 'heart']
            ].map(([label, key]: any) => (
              <div key={key}>
                <p className="text-sm mb-1">{label}</p>
                <input
                  type="number"
                  value={goals[key]}
                  onChange={e =>
                    setGoals({ ...goals, [key]: Number(e.target.value) })
                  }
                  className="w-full px-4 py-3 border border-black/20 rounded-xl"
                />
              </div>
            ))}

            <button
              onClick={() => setEditing(false)}
              className="w-full py-3 bg-pink-300 border border-black rounded-xl font-semibold hover:bg-pink-400"
            >
              Save Goals
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
