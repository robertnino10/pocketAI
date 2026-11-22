import { useState } from 'react';
import { Activity, CalendarDays, ChevronLeft, ChevronRight, Flame, Plus, Sparkles, Trash2, Utensils } from 'lucide-react';
import { dateKey, getWeekDates, todayKey } from '../lib/tracker.js';

const number = (value) => Math.round(value || 0).toLocaleString();
const prettyDate = (value) => new Date(`${value}T00:00:00`).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

export default function Logbook({ data, log, date, setDate, changeDate, onAddFood, onAddWorkout, onQuickAdd, onToggleGym, onEdit, onDelete, onClearMeals, onEstimateMeal, onEstimateWorkout }) {
  const [mealName, setMealName] = useState('');
  const [mealCalories, setMealCalories] = useState('');
  const [mealNote, setMealNote] = useState('Offline estimate using common foods and portions. Adjust before saving.');
  const [workoutName, setWorkoutName] = useState('');
  const [burn, setBurn] = useState('');
  const [workoutNote, setWorkoutNote] = useState('Estimates vary with pace, effort, and rest.');
  const week = getWeekDates(date);
  const totalBurn = log.workouts.reduce((sum, workout) => sum + (Number(workout.caloriesBurned) || 0), 0);

  function estimateMeal() {
    if (!mealName.trim()) {
      setMealNote('Describe a food and portion first, like “2 cups rice and chicken”.');
      return;
    }
    const result = onEstimateMeal(mealName);
    if (result) {
      setMealCalories(String(result.calories));
      setMealNote(`About ${number(result.calories)} kcal · ${result.matched.join(' + ')}. Adjust before saving.`);
    }
  }

  function estimateBurn() {
    if (!workoutName.trim()) {
      setWorkoutNote('Describe your activity and portion, e.g. “5 km run” or “weights 30 min”.');
      return;
    }
    const result = onEstimateWorkout(workoutName);
    if (result) {
      setBurn(String(result));
      setWorkoutNote(`About ${number(result)} kcal burned. Actual burn varies by person and effort.`);
    }
  }

  function submitMeal(event) {
    event.preventDefault();
    if (onAddFood(mealName || 'Meal', mealCalories)) {
      setMealName('');
      setMealCalories('');
      setMealNote('Offline estimate using common foods and portions. Adjust before saving.');
    }
  }

  function submitWorkout(event) {
    event.preventDefault();
    if (onAddWorkout(workoutName, burn || 0)) {
      setWorkoutName('');
      setBurn('');
      setWorkoutNote('Estimates vary with pace, effort, and rest.');
    }
  }

  function resetMeals() {
    if (log.foodEntries.length) onClearMeals(date);
  }

  function toggleWorkoutDay(checked) {
    if (!checked && log.workouts.length && !window.confirm('Unmark this workout day and delete its logged workouts?')) return;
    onToggleGym(checked);
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><p className="eyebrow">YOUR DAILY JOURNAL</p><h1>Food & activity</h1><p className="page-subtitle">Keep track of what fuels you and how you move.</p></div>
      <section className="panel date-panel">
        <div className="date-control"><button className="icon-button" onClick={() => changeDate(-1)} aria-label="Previous day"><ChevronLeft size={17} /></button>
          <label><CalendarDays size={16} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Choose log date" /></label>
          <button className="icon-button" onClick={() => changeDate(1)} aria-label="Next day"><ChevronRight size={17} /></button>
        </div><span className="selected-date-label">{date === todayKey() ? 'Today' : prettyDate(date)}</span>
      </section>
      <div className="week-strip" aria-label="Choose a day">
        {week.map((day) => {
          const key = dateKey(day);
          const selected = date === key;
          const dayLog = data.logs[key];
          return <button key={key} className={selected ? 'week-day selected' : 'week-day'} onClick={() => setDate(key)} aria-label={prettyDate(key)} aria-pressed={selected}>
            <span>{day.toLocaleDateString('en-US', { weekday: 'short' })}</span><strong>{day.getDate()}</strong><i className={dayLog && (dayLog.calories || dayLog.gym) ? 'week-dot has-entry' : 'week-dot'} />
          </button>;
        })}
      </div>

      <div className="log-grid">
        <section className="panel form-panel">
          <div className="section-heading"><div><p className="eyebrow">FOOD & CALORIES</p><h2>Add a meal</h2></div><span className="form-icon meal-icon"><Utensils size={17} /></span></div>
          <form onSubmit={submitMeal} className="entry-form">
            <label>What did you eat?<input value={mealName} onChange={(event) => setMealName(event.target.value)} placeholder="e.g. Rice and chicken adobo" maxLength={120} /></label>
            <div className="input-with-action"><label>Calories<input type="number" min="1" step="1" value={mealCalories} onChange={(event) => setMealCalories(event.target.value)} placeholder="Enter calories" required /></label><button className="button button-primary add-button" type="submit"><Plus size={16} /> Add meal</button></div>
          </form>
          <button className="estimate-button" onClick={estimateMeal}><Sparkles size={15} /> Estimate calories offline</button>
          <p className="form-note" role="status">{mealNote}</p>
          <div className="quick-add"><span>Quick add</span>{[100, 300, 500].map((amount) => <button key={amount} onClick={() => onQuickAdd(amount)}>+{amount}</button>)}</div>
        </section>

        <section className="panel form-panel">
          <div className="section-heading"><div><p className="eyebrow">MOVEMENT & ENERGY</p><h2>Log a workout</h2></div><span className="form-icon workout-icon"><Activity size={18} /></span></div>
          <form onSubmit={submitWorkout} className="entry-form">
            <label>What did you do?<input value={workoutName} onChange={(event) => setWorkoutName(event.target.value)} placeholder="e.g. 5 km run, weights 30 min" maxLength={120} required /></label>
            <div className="input-with-action"><label>Calories burned (optional)<input type="number" min="0" step="1" value={burn} onChange={(event) => setBurn(event.target.value)} placeholder="Enter estimate" /></label><button className="button button-dark add-button" type="submit"><Plus size={16} /> Add workout</button></div>
          </form>
          <button className="estimate-button" onClick={estimateBurn}><Flame size={15} /> Estimate calories burned</button>
          <p className="form-note" role="status">{workoutNote}</p>
          <label className="gym-check"><input type="checkbox" checked={log.gym} onChange={(event) => toggleWorkoutDay(event.target.checked)} /><span className="custom-checkbox" /><span>Mark this day as a workout day</span></label>
        </section>
      </div>

      <section className="panel entries-panel">
        <div className="section-heading"><div><p className="eyebrow">THE DETAILS</p><h2>{date === todayKey() ? 'Today’s log' : prettyDate(date)}</h2></div><div className="entry-total">{number(log.calories)} <span>kcal eaten</span></div></div>
        <div className="entry-list">
          {log.foodEntries.map((entry) => <div className="entry-row" key={entry.id}><span className="entry-icon food-entry-icon"><Utensils size={16} /></span><div className="entry-description"><strong>{entry.name}</strong><span>Meal</span></div><strong className="entry-calories">{number(entry.calories)} <small>kcal</small></strong><div className="entry-actions"><button onClick={() => onEdit({ ...entry, date, type: 'meal' })}>Edit</button><button className="delete-action" onClick={() => onDelete('meal', entry.id, date)} aria-label={`Delete ${entry.name}`}><Trash2 size={15} /></button></div></div>)}
          {log.workouts.map((workout) => <div className="entry-row" key={workout.id}><span className="entry-icon workout-icon"><Activity size={17} /></span><div className="entry-description"><strong>{workout.name}</strong><span>Workout</span></div><strong className="entry-calories burn-calories">{number(workout.caloriesBurned)} <small>kcal burned</small></strong><div className="entry-actions"><button onClick={() => onEdit({ ...workout, date, type: 'workout' })}>Edit</button><button className="delete-action" onClick={() => onDelete('workout', workout.id, date)} aria-label={`Delete ${workout.name}`}><Trash2 size={15} /></button></div></div>)}
          {!log.foodEntries.length && !log.workouts.length && <div className="log-empty"><span className="empty-icon"><CalendarDays size={20} /></span><strong>A fresh day, a fresh start.</strong><p>Add a meal or workout above to see your daily balance take shape.</p></div>}
        </div>
        {(log.foodEntries.length > 0 || log.workouts.length > 0) && <div className="log-footer"><span>{log.foodEntries.length} meal{log.foodEntries.length === 1 ? '' : 's'} · {log.workouts.length} workout{log.workouts.length === 1 ? '' : 's'}</span><span><Flame size={15} /> {number(totalBurn)} kcal exercise burn</span></div>}
        {!!log.foodEntries.length && <button className="clear-meals" onClick={resetMeals}>Clear meals for this day</button>}
      </section>
    </div>
  );
}
