import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, FolderKanban, CheckSquare, LogOut, Users } from 'lucide-react';

const AVATAR_COLORS = ['#3b82f6', '#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899'];

function getAvatarColor(name) {
  let hash = 0;
  for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <h1>Ethara AI</h1>
        <span>Team Task Manager</span>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <div className="nav-section-title">Main Menu</div>
          <NavLink to="/" end className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <LayoutDashboard /> Dashboard
          </NavLink>
          <NavLink to="/projects" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <FolderKanban /> Projects
          </NavLink>
          <NavLink to="/tasks" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <CheckSquare /> All Tasks
          </NavLink>
          <NavLink to="/team" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
            <Users /> Team
          </NavLink>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <div className="user-avatar" style={{ background: getAvatarColor(user?.name) }}>
            {user?.avatar || 'U'}
          </div>
          <div className="user-details">
            <div className="name">{user?.name}</div>
            <div className="email">{user?.email}</div>
          </div>
          <button className="btn-icon" onClick={handleLogout} title="Logout">
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
