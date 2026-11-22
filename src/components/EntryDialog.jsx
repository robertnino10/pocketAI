import { useState } from 'react';
import { X } from 'lucide-react';

export default function EntryDialog({ entry, onSave, onClose }) {
  const [name, setName] = useState(entry.name || '');
  const [calories, setCalories] = useState(String(entry.type === 'meal' ? entry.calories : entry.caloriesBurned || 0));
  const isMeal = entry.type === 'meal';

  function submit(event) {
    event.preventDefault();
    onSave({
      ...entry,
      name,
      ...(isMeal ? { calories } : { caloriesBurned: calories }),
    });
  }

  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <form className="entry-modal" role="dialog" aria-modal="true" aria-labelledby="edit-title" onSubmit={submit}>
      <button type="button" className="icon-button modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button>
      <p className="eyebrow">UPDATE YOUR LOG</p><h2 id="edit-title">Edit {isMeal ? 'meal' : 'workout'}</h2>
      <label>{isMeal ? 'Meal name' : 'Workout name'}<input value={name} onChange={(event) => setName(event.target.value)} maxLength={120} required autoFocus /></label>
      <label>{isMeal ? 'Calories eaten' : 'Estimated calories burned'}<input type="number" min={isMeal ? 1 : 0} step="1" value={calories} onChange={(event) => setCalories(event.target.value)} required /></label>
      <div className="modal-actions"><button type="button" className="button button-outline" onClick={onClose}>Cancel</button><button type="submit" className="button button-primary">Save changes</button></div>
    </form>
  </div>;
}
