import { Activity, ArrowRight, Sparkles } from 'lucide-react';
import { buildInsights } from '../lib/tracker.js';

export default function Coach({ data, insights, onRunInsights, onNavigate }) {
  const cards = insights.length ? insights : buildInsights(data.logs, data.profile);
  return (
    <div className="page-stack coach-page">
      <div className="page-heading"><p className="eyebrow">A LITTLE PERSPECTIVE</p><h1>Your weekly insights</h1><p className="page-subtitle">Friendly reflections on the habits you’ve been building.</p></div>
      <section className="coach-hero">
        <span className="coach-sparkle"><Sparkles size={24} /></span><div><span className="eyebrow">POCKETCOACH CHECK-IN</span><h2>Consistency over perfection.</h2><p>Your estimates are a guide, not a grade. Use these patterns to learn what works for you.</p></div>
        <button className="button button-light" onClick={onRunInsights}>Refresh insights <ArrowRight size={16} /></button>
      </section>
      <section className="panel insights-panel"><div className="section-heading"><div><p className="eyebrow">LAST 7 DAYS</p><h2>Your progress notes</h2></div><span className="form-icon workout-icon"><Activity size={18} /></span></div>
        <div className="insight-list">{cards.map((insight, index) => <article className="insight-card" key={`${index}-${insight}`}><span className="insight-number">{String(index + 1).padStart(2, '0')}</span><p>{insight}</p></article>)}</div>
      </section>
      {!data.profile && <div className="coach-setup"><span>Make your insights personal</span><p>Add a few details to get an estimated daily calorie goal and burn baseline.</p><button className="text-button" onClick={() => onNavigate('profile')}>Set up your profile <span>→</span></button></div>}
      <p className="disclaimer">Calorie, BMR, TDEE, and exercise values are estimates for general wellness, not medical advice.</p>
    </div>
  );
}
