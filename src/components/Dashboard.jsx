import { ArrowDownRight, ArrowUpRight, CalendarDays, ChevronLeft, ChevronRight, Flame, Footprints, Utensils } from 'lucide-react';
import { dateKey, getBurnedCalories, getLog, getWeekDates, todayKey } from '../lib/tracker.js';

const formatNumber = (number) => Math.round(number || 0).toLocaleString();
const formatDate = (date, options) => new Date(`${date}T00:00:00`).toLocaleDateString('en-US', options);

export default function Dashboard({ data, log, date, setDate, changeDate, onNavigate }) {
  const profile = data.profile;
  const target = Number(profile?.targetCalories) || 0;
  const burn = getBurnedCalories(log, profile);
  const remaining = target - log.calories;
  const balance = profile ? log.calories - burn.total : null;
  const progress = target ? Math.min(log.calories / target, 1) : 0;
  const selectedIsToday = date === todayKey();
  const week = getWeekDates(date);
  const maxValue = Math.max(target, ...week.map((day) => {
    const key = dateKey(day);
    const dayLog = getLog(data.logs, key);
    return Math.max(dayLog.calories, getBurnedCalories(dayLog, profile).total);
  }), 1);
  const recentMeals = log.foodEntries.slice(-4).reverse();
  const dateLabel = selectedIsToday ? 'Today' : formatDate(date, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <div className="page-stack">
      <div className="page-heading heading-with-controls">
        <div><p className="eyebrow">{selectedIsToday ? 'YOUR DAILY CHECK-IN' : 'PAST DAY'}</p><h1>{selectedIsToday ? 'Good day to feel good.' : dateLabel}</h1>
          <p className="page-subtitle">A little snapshot of your health habits.</p></div>
        <div className="date-control">
          <button className="icon-button" onClick={() => changeDate(-1)} aria-label="Previous day"><ChevronLeft size={17} /></button>
          <label><CalendarDays size={16} /><input type="date" value={date} onChange={(event) => setDate(event.target.value)} aria-label="Choose dashboard date" /></label>
          <button className="icon-button" onClick={() => changeDate(1)} aria-label="Next day"><ChevronRight size={17} /></button>
        </div>
      </div>

      <section className="hero-card">
        <div className="hero-copy">
          <span className="hero-tag"><span className="status-dot" /> DAILY CALORIE BALANCE</span>
          <h2>{balance === null ? 'See your day in balance' : balance > 0 ? 'You’re in a surplus' : balance < 0 ? 'You’re in a deficit' : 'Your day, in balance'}</h2>
          <p>Based on your food log and estimated daily energy use.</p>
          <div className="balance-number">{balance === null ? '—' : <>{balance < 0 ? '−' : balance > 0 ? '+' : ''}{formatNumber(Math.abs(balance))}<span> kcal</span></>}</div>
          <div className="balance-caption">{balance === null ? 'add a profile to estimate your daily burn' : balance < 0 ? 'estimated deficit' : balance > 0 ? 'estimated surplus' : 'intake and burn are even'}</div>
        </div>
        <div className="balance-graphic" aria-hidden="true"><div className="orbit orbit-one" /><div className="orbit orbit-two" /><span><Flame size={31} /></span><i className="orbit-dot dot-one" /><i className="orbit-dot dot-two" /></div>
        <div className="balance-footnote">{profile ? <>Intake <strong>{formatNumber(log.calories)} kcal</strong><span>−</span> estimated burn <strong>{formatNumber(burn.total)} kcal</strong></> : 'Set up your profile to compare intake and estimated daily burn.'}</div>
      </section>

      <section className="stats-grid" aria-label="Today's calorie summary">
        <article className="stat-card intake-stat">
          <div className="stat-top"><span className="stat-icon"><Utensils size={18} /></span><span className="stat-label">EATEN</span><span className="stat-unit">TODAY</span></div>
          <p className="stat-value">{formatNumber(log.calories)}<span>kcal</span></p>
          <div className="stat-bottom"><span>{target ? `${formatNumber(remaining)} kcal ${remaining >= 0 ? 'to goal' : 'over goal'}` : 'Set a goal in your profile'}</span><div className="mini-progress"><i style={{ width: `${progress * 100}%` }} /></div></div>
        </article>
        <article className="stat-card burn-stat">
          <div className="stat-top"><span className="stat-icon"><Flame size={18} /></span><span className="stat-label">BURNED</span><span className="stat-unit">ESTIMATED</span></div>
          <p className="stat-value">{profile || burn.exercise ? formatNumber(burn.total) : '—'}<span>kcal</span></p>
          <div className="burn-breakdown">{profile ? <><span>Daily baseline <strong>{formatNumber(burn.baseline)}</strong></span><span>Exercise <strong>{formatNumber(burn.exercise)}</strong></span></> : <span>Set up your profile for a daily estimate</span>}</div>
        </article>
        <article className="stat-card goal-stat">
          <div className="stat-top"><span className="stat-icon"><ArrowDownRight size={18} /></span><span className="stat-label">DAILY GOAL</span></div>
          <p className="stat-value">{target ? formatNumber(target) : '—'}<span>kcal</span></p>
          <div className="stat-bottom"><span>{profile ? 'Personalized from your profile' : 'Add your profile to calculate'}</span></div>
        </article>
      </section>

      <div className="dashboard-columns">
        <section className="panel trend-panel">
          <div className="section-heading"><div><p className="eyebrow">YOUR RHYTHM</p><h2>Intake vs. burn</h2></div><div className="chart-legend"><span><i className="legend-intake" /> Intake</span><span><i className="legend-burn" /> Burn</span></div></div>
          <p className="panel-subtitle">A look at this week’s daily estimates.</p>
          <div className="chart-wrap" role="img" aria-label="Bar chart comparing daily calorie intake with estimated calories burned for each day this week">
            <div className="chart-scale"><span>{formatNumber(maxValue)}</span><span>{formatNumber(maxValue / 2)}</span><span>0</span></div>
            <div className="chart-grid"><i /><i /><i /></div>
            <div className="bar-chart">
              {week.map((day) => {
                const key = dateKey(day);
                const dayLog = getLog(data.logs, key);
                const dayBurn = getBurnedCalories(dayLog, profile).total;
                const today = key === todayKey();
                return <div className={key === date ? 'bar-day selected' : 'bar-day'} key={key} title={`${formatDate(key, { weekday: 'long' })}: ${formatNumber(dayLog.calories)} kcal intake, ${formatNumber(dayBurn)} kcal estimated burn`}>
                  <div className="bar-pair"><i className="bar intake-bar" style={{ height: `${Math.max(dayLog.calories ? 3 : 0, (dayLog.calories / maxValue) * 100)}%` }} /><i className="bar burn-bar" style={{ height: `${Math.max(dayBurn ? 3 : 0, (dayBurn / maxValue) * 100)}%` }} /></div>
                  <span>{formatDate(key, { weekday: 'short' }).slice(0, 1)}</span>{today && <small>today</small>}
                </div>;
              })}
            </div>
          </div>
          <div className="chart-note"><span className="chart-note-dot" /> Burn includes your profile’s estimated daily baseline plus logged exercise.</div>
        </section>

        <section className="panel meal-panel">
          <div className="section-heading"><div><p className="eyebrow">FUEL FOR YOUR DAY</p><h2>Recent meals</h2></div><button className="text-button" onClick={() => onNavigate('log')}>View log <span>→</span></button></div>
          <div className="meal-list">
            {recentMeals.length ? recentMeals.map((meal) => <div className="meal-row" key={meal.id}><span className="meal-icon"><Utensils size={15} /></span><span className="meal-name">{meal.name}</span><strong>{formatNumber(meal.calories)} <small>kcal</small></strong></div>)
              : <div className="empty-meals"><span className="empty-icon"><Utensils size={19} /></span><strong>Your meals will show up here</strong><p>Log what you eat to get a clearer picture of your day.</p><button className="text-button" onClick={() => onNavigate('log')}>Log a meal <span>→</span></button></div>}
          </div>
          {log.workouts.length > 0 && <div className="workout-callout"><span className="workout-icon"><Footprints size={16} /></span><span>{log.workouts.length} workout{log.workouts.length > 1 ? 's' : ''} logged</span><strong>{formatNumber(burn.exercise)} kcal</strong></div>}
        </section>
      </div>
    </div>
  );
}
