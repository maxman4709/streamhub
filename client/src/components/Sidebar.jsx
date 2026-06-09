import { NavLink, useLocation } from 'react-router-dom';

const NAV = [
  { to: '/',           label: 'Home',      icon: '⌂',  end: true },
  { to: '/channels',   label: 'Channels',  icon: '◉' },
  { to: '/actresses',  label: 'Actresses', icon: '♀' },
  { to: '/actors',     label: 'Actors',    icon: '♂' },
  { to: '/favorites',  label: 'Favorites', icon: '♥' },
];

function cls({ isActive }) {
  return `nav-item${isActive ? ' active' : ''}`;
}

export default function Sidebar() {
  return (
    <>
      {/* Desktop sidebar */}
      <nav className="sidebar">
        <div className="sidebar-logo">▶ StreamHub</div>

        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end} className={cls}>
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}

        <div className="sidebar-divider" />

        <NavLink to="/admin" className={cls}>
          <span className="nav-icon">⚙</span>
          <span>Admin</span>
        </NavLink>
      </nav>

      {/* Mobile bottom nav */}
      <nav className="bottom-nav">
        {NAV.map((item) => (
          <NavLink key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `bottom-nav-item${isActive ? ' active' : ''}`}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}
