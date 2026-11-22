import { Activity } from 'lucide-react';

export default function Sidebar({ navigation, activeTab, onNavigate }) {
  return (
    <aside className="sidebar">
      <a className="brand" href="#" onClick={(event) => { event.preventDefault(); onNavigate('dashboard'); }}>
        <span className="brand-mark"><Activity size={19} /></span>
        <span>pocket<span className="brand-accent">coach</span></span>
      </a>
      <p className="nav-caption">WORKSPACE</p>
      <nav className="side-nav" aria-label="Main navigation">
        {navigation.map(({ id, label, icon: Icon }) => (
          <button key={id} className={activeTab === id ? 'side-nav-item active' : 'side-nav-item'} onClick={() => onNavigate(id)}>
            <Icon size={18} strokeWidth={1.8} /><span>{label}</span>{activeTab === id && <span className="nav-active-mark" />}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-tip">
          <span className="tip-icon"><Activity size={15} /></span>
          <strong>Small steps add up.</strong>
          <p>Progress is a practice, not a perfect streak.</p>
        </div>
        <div className="privacy-label"><span className="status-dot" /> Your data stays on this device</div>
      </div>
    </aside>
  );
}
