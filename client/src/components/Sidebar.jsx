import { NavLink } from 'react-router-dom';

const ICONS = [
  { to: '/', label: 'Home', glyph: '⌂' },
  { to: '/?sort=trending', label: 'Trending', glyph: '◎' },
  { to: '/saved', label: 'Saved', glyph: '🔖' },
  { to: '/liked', label: 'Liked', glyph: '♥' },
  { to: '/history', label: 'History', glyph: '⏱' },
  { to: '/admin', label: 'Admin', glyph: '⚙' },
];

export default function Sidebar() {
  return (
    <nav className="sidebar">
      <div className="sidebar-logo">▶</div>
      {ICONS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          className={({ isActive }) => `sidebar-icon${isActive ? ' active' : ''}`}
          title={item.label}
        >
          {item.glyph}
        </NavLink>
      ))}
    </nav>
  );
}
