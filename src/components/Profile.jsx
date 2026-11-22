import { useState } from 'react';
import { Activity, Download, ShieldCheck, Upload } from 'lucide-react';

const initialForm = (profile) => ({
  age: profile?.age || '',
  gender: profile?.gender || 'female',
  weight: profile?.weight || '',
  unit: profile?.unit || 'cm',
  height: profile?.height || '',
  heightFt: profile?.heightFt || '',
  heightIn: profile?.heightIn || '',
  activityLevel: String(profile?.activityLevel || 1.375),
  deficitGoal: String(profile?.deficitGoal ?? 300),
});

export default function Profile({ data, onSaveProfile, onExport, onImport }) {
  const [form, setForm] = useState(() => initialForm(data.profile));
  const profile = data.profile;
  const bmr = profile?.bmr || 0;
  const tdee = profile?.tdee || 0;
  const target = profile?.targetCalories || 0;

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function submit(event) {
    event.preventDefault();
    const height = form.unit === 'ft'
      ? Number(form.heightFt) * 30.48 + Number(form.heightIn || 0) * 2.54
      : Number(form.height);
    if (!Number.isFinite(height) || height < 100 || height > 250) return;
    onSaveProfile(form);
  }

  function importFile(event) {
    onImport(event.target.files?.[0]);
    event.target.value = '';
  }

  return (
    <div className="page-stack">
      <div className="page-heading"><p className="eyebrow">YOUR STARTING POINT</p><h1>My profile</h1><p className="page-subtitle">A few details help us estimate your daily calorie needs.</p></div>
      <div className="profile-layout">
        <section className="panel profile-form-panel">
          <div className="section-heading"><div><p className="eyebrow">PERSONAL DETAILS</p><h2>About you</h2></div><span className="form-icon workout-icon"><Activity size={19} /></span></div>
          <form className="profile-form" onSubmit={submit}>
            <div className="form-row">
              <label>Age<input type="number" min="10" max="120" required value={form.age} onChange={(event) => update('age', event.target.value)} placeholder="e.g. 28" /></label>
              <label>Gender<select value={form.gender} onChange={(event) => update('gender', event.target.value)}><option value="female">Female</option><option value="male">Male</option></select></label>
            </div>
            <div className="form-row">
              <label>Weight (kg)<input type="number" min="30" max="300" step="0.1" required value={form.weight} onChange={(event) => update('weight', event.target.value)} placeholder="e.g. 68" /></label>
              <div><label>Height <select className="unit-select" value={form.unit} onChange={(event) => update('unit', event.target.value)}><option value="cm">cm</option><option value="ft">ft / in</option></select></label>
                {form.unit === 'cm' ? <input type="number" min="100" max="250" required value={form.height} onChange={(event) => update('height', event.target.value)} placeholder="e.g. 170" aria-label="Height in centimeters" />
                  : <div className="form-row height-pair"><input type="number" min="3" max="8" required value={form.heightFt} onChange={(event) => update('heightFt', event.target.value)} placeholder="ft" aria-label="Height feet" /><input type="number" min="0" max="11" value={form.heightIn} onChange={(event) => update('heightIn', event.target.value)} placeholder="in" aria-label="Height inches" /></div>}
              </div>
            </div>
            <label>Everyday activity level<select value={form.activityLevel} onChange={(event) => update('activityLevel', event.target.value)}><option value="1.2">Mostly sitting, little daily movement</option><option value="1.375">Lightly active, regular walking</option><option value="1.55">Moderately active, active job or routine</option></select></label>
            <p className="field-note">Choose your usual daily movement, not your gym sessions. Logged workouts are added separately to your burn estimate.</p>
            <label>Calorie goal<select value={form.deficitGoal} onChange={(event) => update('deficitGoal', event.target.value)}><option value="0">Maintain weight</option><option value="300">Gentle deficit (−300 kcal/day)</option><option value="500">Standard deficit (−500 kcal/day)</option><option value="800">Larger deficit (−800 kcal/day)</option></select></label>
            <button type="submit" className="button button-primary save-profile">Save profile & calculate targets</button>
          </form>
        </section>

        <div className="profile-side">
          <section className="profile-results">
            <p className="eyebrow">YOUR ESTIMATES</p><h2>Daily calorie guide</h2><p className="profile-results-note">These are estimates to help you spot patterns, not strict rules.</p>
            <div className="target-row"><span>Resting needs <small>BMR</small></span><strong>{bmr ? `${bmr.toLocaleString()} kcal` : '—'}</strong></div>
            <div className="target-row"><span>Daily baseline <small>TDEE</small></span><strong>{tdee ? `${tdee.toLocaleString()} kcal` : '—'}</strong></div>
            <div className="target-total"><span>Your daily intake target</span><strong>{target ? target.toLocaleString() : '—'} <small>kcal</small></strong></div>
            {profile && <div className="weight-summary"><span>Current weight</span><strong>{profile.weight} kg</strong></div>}
          </section>
          <section className="panel backup-panel">
            <div className="backup-heading"><span className="backup-icon"><ShieldCheck size={18} /></span><div><h3>Your data, your device</h3><p>Your profile and logs are saved in this browser.</p></div></div>
            <div className="backup-actions"><button className="button button-outline" onClick={onExport}><Download size={15} /> Export backup</button><label className="button button-outline"><Upload size={15} /> Import backup<input type="file" accept="application/json,.json" onChange={importFile} /></label></div>
          </section>
        </div>
      </div>
      <p className="disclaimer">Calorie, BMR, TDEE, and exercise values are estimates for general wellness, not medical advice.</p>
    </div>
  );
}
