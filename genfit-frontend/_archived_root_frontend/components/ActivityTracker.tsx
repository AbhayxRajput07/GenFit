import React, { useState } from 'react';
import { ActivityData } from '../types';
import { Plus, Search, Clock, Zap, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ActivityTrackerProps {
  addActivity: (activity: ActivityData) => void;
  activities: ActivityData[];
}

const workoutOptions = [
  { name: 'Running', icon: '🏃' },
  { name: 'Walking', icon: '🚶' },
  { name: 'Cycling', icon: '🚴' },
  { name: 'Swimming', icon: '🏊' },
  { name: 'Gym Workout', icon: '🏋️' },
  { name: 'HIIT', icon: '🔥' },
  { name: 'Yoga', icon: '🧘' },
  { name: 'Football', icon: '⚽' },
  { name: 'Cricket', icon: '🏏' },
  { name: 'Basketball', icon: '🏀' },
  { name: 'Dance', icon: '💃' },
  { name: 'Stretching', icon: '🤸' }
];

const ActivityTracker: React.FC<ActivityTrackerProps> = ({ addActivity, activities }) => {
  const [type, setType] = useState('');
  const [duration, setDuration] = useState('');
  const [intensity, setIntensity] = useState<'Low' | 'Medium' | 'High'>('Medium');
  const [dropdown, setDropdown] = useState(false);
  const [search, setSearch] = useState('');
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const todayStr = new Date().toDateString();

  // 🔥 GROUP ACTIVITIES BY DATE
  const grouped = activities.reduce((acc: any, act) => {
    const d = new Date(act.timestamp).toDateString();
    if (!acc[d]) acc[d] = [];
    acc[d].push(act);
    return acc;
  }, {});

  const todayActivities = grouped[todayStr] || [];

  const saveActivity = () => {
    if (!type || !duration) return;

    const cal =
      intensity === 'High' ? 12 :
      intensity === 'Medium' ? 8 : 4;

    addActivity({
      id: Date.now().toString(),
      type,
      durationMinutes: Number(duration),
      caloriesBurned: Number(duration) * cal,
      intensity,
      timestamp: new Date(),
    });

    setType('');
    setDuration('');
  };

  return (
    <div className="w-full min-h-screen px-12 py-10 bg-gradient-to-br from-white via-rose-50 to-pink-100">

      <h2 className="text-4xl font-semibold mb-8">Activity</h2>

      {/* INPUT */}
      <div className="flex gap-4 p-6 rounded-3xl bg-white shadow border mb-10">

        {/* Dropdown */}
        <div className="relative flex-1">
          <div
            onClick={() => setDropdown(!dropdown)}
            className="px-4 py-3 border rounded-xl flex gap-2 cursor-pointer"
          >
            <Search size={16}/>
            {type || 'Select Activity'}
          </div>

          {dropdown && (
            <div className="absolute mt-2 w-full bg-white border rounded-xl p-2 shadow max-h-60 overflow-y-auto z-50">
              <input
                placeholder="Search activity..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full mb-2 px-3 py-2 border rounded"
              />

              {workoutOptions
                .filter(w => w.name.toLowerCase().includes(search.toLowerCase()))
                .map(w => (
                  <div
                    key={w.name}
                    onClick={() => { setType(w.name); setDropdown(false); }}
                    className="p-2 hover:bg-pink-100 rounded cursor-pointer"
                  >
                    {w.icon} {w.name}
                  </div>
                ))}
            </div>
          )}
        </div>

        <input
          placeholder="Minutes"
          type="number"
          value={duration}
          onChange={e => setDuration(e.target.value)}
          className="px-4 py-3 border rounded-xl w-32"
        />

        <select
          value={intensity}
          onChange={e => setIntensity(e.target.value as any)}
          className="px-4 py-3 border rounded-xl"
        >
          <option>Low</option>
          <option>Medium</option>
          <option>High</option>
        </select>

        <button
          onClick={saveActivity}
          className="px-6 py-3 rounded-xl bg-pink-200 font-semibold flex gap-2 items-center"
        >
          <Plus size={18}/> Add
        </button>
      </div>

      {/* 🔥 TODAY SECTION */}
      <h3 className="text-xl font-semibold mb-4">Today</h3>

      {todayActivities.length === 0 ? (
        <div className="p-16 text-center border border-black/20 rounded-3xl bg-white">
          <p className="text-lg font-medium">No activities added yet</p>
          <p className="text-sm text-gray-500 mt-2">
            Add your first activity for today.
          </p>
        </div>
      ) : (
        todayActivities.map(a => (
          <motion.div
            key={a.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 rounded-2xl bg-white border flex justify-between items-center mb-3 shadow-sm"
          >
            <div>
              <p className="font-semibold">{a.type}</p>
              <p className="text-xs flex gap-3">
                <Clock size={12}/> {a.durationMinutes}m
                <Zap size={12}/> {a.intensity}
              </p>
            </div>
            <p className="font-bold">{a.caloriesBurned} kcal</p>
          </motion.div>
        ))
      )}

      {/* 🔥 HISTORY */}
      <h3 className="text-xl font-semibold mt-10 mb-4">Past Days</h3>

      {Object.keys(grouped)
        .filter(date => date !== todayStr)
        .map(date => (
          <div key={date} className="mb-4">

            <div
              onClick={() => setExpandedDate(expandedDate === date ? null : date)}
              className="flex justify-between items-center p-4 bg-white rounded-xl cursor-pointer border"
            >
              <span>{date}</span>
              <ChevronDown />
            </div>

            <AnimatePresence>
              {expandedDate === date && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  {grouped[date].map((a: ActivityData) => (
                    <div key={a.id} className="p-4 border-b bg-white">
                      {a.type} • {a.durationMinutes}m • {a.caloriesBurned} kcal
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
    </div>
  );
};

export default ActivityTracker;