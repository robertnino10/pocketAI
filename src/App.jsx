import { useEffect, useState } from 'react';
import { Activity, LayoutDashboard, LogIn, UserRound, Sparkles } from 'lucide-react';
import Sidebar from './components/Sidebar.jsx';
import Dashboard from './components/Dashboard.jsx';
import Logbook from './components/Logbook.jsx';
import Coach from './components/Coach.jsx';
import Profile from './components/Profile.jsx';
import EntryDialog from './components/EntryDialog.jsx';
import {
  buildInsights,
  calculateProfile,
  dateKey,
  estimateMealCalories,
  estimateWorkoutCalories,
  getLog,
  loadTrackerData,
  normalizeLog,
  persistTrackerData,
  todayKey,
} from './lib/tracker.js';

const navigation = [
  { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
  { id: 'log', label: 'Food & activity', icon: LogIn },
  { id: 'coach', label: 'Insights', icon: Sparkles },
  { id: 'profile', label: 'My profile', icon: UserRound },
];

export default function App() {
  const [data, setData] = useState(loadTrackerData);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedDate, setSelectedDate] = useState(todayKey);
  const [notice, setNotice] = useState('');
  const [editing, setEditing] = useState(null);
  const [insights, setInsights] = useState([]);

  useEffect(() => {
    try {
      persistTrackerData(data);
    } catch (error) {
      console.error('Could not save PocketCoach data:', error);
      setNotice('Your changes could not be saved. Check your browser storage space.');
    }
  }, [data]);

  useEffect(() => {
    if (notice) {
      const timeout = window.setTimeout(() => setNotice(''), 3500);
      return () => window.clearTimeout(timeout);
    }
    return undefined;
  }, [notice]);

  const currentLog = getLog(data.logs, selectedDate);

  function updateLog(date, change) {
    setData((current) => {
      const log = normalizeLog(date, current.logs[date]);
      const nextLog = change(log);
      nextLog.calories = nextLog.foodEntries.reduce((sum, entry) => sum + Number(entry.calories || 0), 0);
      nextLog.gym = nextLog.workouts.length > 0;
      return { ...current, logs: { ...current.logs, [date]: nextLog } };
    });
  }

  function addFood(name, calories) {
    const value = Number(calories);
    if (!name.trim() || !Number.isFinite(value) || value <= 0) {
      setNotice('Add a meal name and a calorie amount greater than zero.');
      return false;
    }
    updateLog(selectedDate, (log) => ({
      ...log,
      foodEntries: [...log.foodEntries, { id: crypto.randomUUID(), name: name.trim(), calories: Math.round(value) }],
    }));
    setNotice('Meal added to your day.');
    return true;
  }

  function addWorkout(name, caloriesBurned) {
    const burn = Number(caloriesBurned) || 0;
    if (!name.trim()) {
      setNotice('Add a workout name first.');
      return false;
    }
    if (!Number.isFinite(burn) || burn < 0) {
      setNotice('Workout calories must be zero or more.');
      return false;
    }
    updateLog(selectedDate, (log) => ({
      ...log,
      workouts: [...log.workouts, {
        id: crypto.randomUUID(),
        name: name.trim(),
        caloriesBurned: Math.round(burn),
      }],
      workoutType: name.trim(),
    }));
    setNotice('Workout added to your day.');
    return true;
  }

  function updateEntry(entry) {
    if (entry.type === 'meal') {
      const calories = Number(entry.calories);
      if (!entry.name.trim() || !Number.isFinite(calories) || calories <= 0) {
        setNotice('Add a meal name and a calorie amount greater than zero.');
        return false;
      }
      updateLog(entry.date, (log) => ({
        ...log,
        foodEntries: log.foodEntries.map((item) => item.id === entry.id
          ? { ...item, name: entry.name.trim(), calories: Math.round(calories) }
          : item),
      }));
    } else {
      const caloriesBurned = Number(entry.caloriesBurned) || 0;
      if (!entry.name.trim() || !Number.isFinite(caloriesBurned) || caloriesBurned < 0) {
        setNotice('Add a workout name and a valid burn estimate.');
        return false;
      }
      updateLog(entry.date, (log) => ({
        ...log,
        workouts: log.workouts.map((item) => item.id === entry.id
          ? { ...item, name: entry.name.trim(), caloriesBurned: Math.round(caloriesBurned) }
          : item),
      }));
    }
    setEditing(null);
    setNotice('Entry updated.');
    return true;
  }

  function deleteEntry(type, id, date) {
    if (!window.confirm(`Delete this ${type === 'meal' ? 'meal' : 'workout'}?`)) return;
    updateLog(date, (log) => ({
      ...log,
      foodEntries: type === 'meal' ? log.foodEntries.filter((entry) => entry.id !== id) : log.foodEntries,
      workouts: type === 'workout' ? log.workouts.filter((entry) => entry.id !== id) : log.workouts,
    }));
  }

  function clearMeals(date) {
    if (!window.confirm(`Delete all meals logged for ${new Date(`${date}T00:00:00`).toLocaleDateString()}?`)) return;
    updateLog(date, (log) => ({ ...log, foodEntries: [] }));
    setNotice('Meals cleared for this day.');
  }

  function quickAdd(calories) {
    updateLog(selectedDate, (log) => ({
      ...log,
      foodEntries: [...log.foodEntries, { id: crypto.randomUUID(), name: 'Quick add', calories }],
    }));
    setNotice(`${calories} kcal added.`);
  }

  function saveProfile(form) {
    const age = Number(form.age);
    const weight = Number(form.weight);
    const height = form.unit === 'ft'
      ? Number(form.heightFt) * 30.48 + Number(form.heightIn || 0) * 2.54
      : Number(form.height);
    const profile = calculateProfile({
      age,
      gender: form.gender,
      weight,
      height,
      activityLevel: Number(form.activityLevel),
      deficitGoal: Number(form.deficitGoal),
    });
    const today = todayKey();
    setData((current) => {
      const existing = current.weightHistory.some((entry) => entry.date === today);
      const weightHistory = existing
        ? current.weightHistory.map((entry) => entry.date === today ? { ...entry, weight } : entry)
        : [...current.weightHistory, { date: today, weight }];
      weightHistory.sort((a, b) => a.date.localeCompare(b.date));
      return { ...current, profile: { ...profile, unit: form.unit, heightFt: form.heightFt, heightIn: form.heightIn }, weightHistory };
    });
    setNotice('Your profile and calorie targets have been saved.');
  }

  function estimateMeal(description) {
    const result = estimateMealCalories(description);
    if (!result) {
      setNotice('Could not match that meal. Try a common food with its portion, such as “2 cups rice and chicken”.');
      return null;
    }
    return result;
  }

  function estimateWorkout(description) {
    const result = estimateWorkoutCalories(description, Number(data.profile?.weight));
    if (!result) {
      setNotice(data.profile?.weight
        ? 'Try a distance activity (“5 km run”) or a timed strength workout (“weights 30 min”).'
        : 'Add your weight in your profile to estimate calories burned.');
      return null;
    }
    return result;
  }

  function changeDate(offset) {
    const date = new Date(`${selectedDate}T00:00:00`);
    date.setDate(date.getDate() + offset);
    setSelectedDate(dateKey(date));
  }

  function exportData() {
    const blob = new Blob([JSON.stringify({ ...data, selectedDate }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pocketcoach-backup.json';
    link.click();
    URL.revokeObjectURL(url);
    setNotice('Backup downloaded.');
  }

  async function importData(file) {
    if (!file) return;
    try {
      const imported = JSON.parse(await file.text());
      if (!imported || typeof imported !== 'object' || !imported.logs || typeof imported.logs !== 'object') {
        throw new Error('The selected file is not a PocketCoach backup.');
      }
      const logs = Object.fromEntries(
        Object.entries(imported.logs).map(([date, log]) => [date, normalizeLog(date, log)]),
      );
      setData({
        profile: imported.profile || null,
        logs,
        weightHistory: Array.isArray(imported.weightHistory) ? imported.weightHistory : [],
      });
      setSelectedDate(todayKey());
      setActiveTab('dashboard');
      setNotice('Backup imported successfully.');
    } catch (error) {
      console.error('Could not import PocketCoach backup:', error);
      setNotice('Could not import that file. Choose a valid PocketCoach JSON backup.');
    }
  }

  function runInsights() {
    setInsights(buildInsights(data.logs, data.profile));
  }

  const pageProps = {
    data,
    log: currentLog,
    date: selectedDate,
    setDate: setSelectedDate,
    changeDate,
    onNavigate: setActiveTab,
    onAddFood: addFood,
    onAddWorkout: addWorkout,
    onQuickAdd: quickAdd,
    onToggleGym: (checked) => updateLog(selectedDate, (log) => ({
      ...log,
      workouts: checked
        ? [...log.workouts, { id: crypto.randomUUID(), name: 'Workout', caloriesBurned: 0 }]
        : [],
    })),
    onEdit: setEditing,
    onDelete: deleteEntry,
    onClearMeals: clearMeals,
    onEstimateMeal: estimateMeal,
    onEstimateWorkout: estimateWorkout,
    onSaveProfile: saveProfile,
    onExport: exportData,
    onImport: importData,
    insights,
    onRunInsights: runInsights,
  };

  return (
    <div className="app-shell">
      <Sidebar navigation={navigation} activeTab={activeTab} onNavigate={setActiveTab} />
      <div className="workspace">
        <header className="topbar">
          <div className="mobile-brand"><span className="brand-mark"><Activity size={18} /></span> pocket<span>coach</span></div>
          <div className="topbar-note"><span className="status-dot" /> Your health journey, at your pace</div>
          <button className="topbar-profile" onClick={() => setActiveTab('profile')} aria-label="Open profile">
            <span className="avatar">{data.profile?.gender === 'female' ? 'S' : 'Y'}</span>
            <span>{data.profile ? 'My profile' : 'Set up profile'}</span>
          </button>
        </header>
        <main className="page-content">
          {!data.profile && activeTab !== 'profile' && (
            <button className="setup-notice" onClick={() => setActiveTab('profile')}>
              <span className="setup-notice-icon"><Activity size={18} /></span>
              <span><strong>Set your starting point</strong><small>Add your profile to see estimated daily burn and a personalized calorie goal.</small></span>
              <span className="setup-action">Set up profile <span aria-hidden="true">→</span></span>
            </button>
          )}
          {activeTab === 'dashboard' && <Dashboard {...pageProps} />}
          {activeTab === 'log' && <Logbook {...pageProps} />}
          {activeTab === 'coach' && <Coach {...pageProps} />}
          {activeTab === 'profile' && <Profile {...pageProps} />}
        </main>
        <nav className="mobile-nav" aria-label="Main navigation">
          {navigation.map(({ id, label, icon: Icon }) => (
            <button key={id} className={activeTab === id ? 'mobile-nav-item active' : 'mobile-nav-item'} onClick={() => setActiveTab(id)}>
              <Icon size={19} /><span>{label === 'Food & activity' ? 'Log' : label}</span>
            </button>
          ))}
        </nav>
      </div>
      {editing && <EntryDialog entry={editing} onSave={updateEntry} onClose={() => setEditing(null)} />}
      {notice && <div className="toast" role="status">{notice}</div>}
    </div>
  );
}
