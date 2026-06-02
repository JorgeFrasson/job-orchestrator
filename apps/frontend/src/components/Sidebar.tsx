import { Link, useLocation } from 'react-router-dom';
import { AppIcon } from './AppIcon';
import './Sidebar.css';

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

const Sidebar = ({ isCollapsed, onToggle }: SidebarProps) => {
  const location = useLocation();
  const isJobsRoute =
    location.pathname === '/' ||
    location.pathname.startsWith('/jobs/');

  const primaryItems = [
    {
      path: '/',
      label: 'Jobs',
      icon: 'lucide:workflow',
      isActive: isJobsRoute,
      description: 'Registro e configuração',
    },
    {
      path: '/about',
      label: 'About',
      icon: 'lucide:info',
      isActive: location.pathname === '/about',
      description: 'Stack e arquitetura',
    },
  ];

  return (
    <aside className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-brand">
          <div className="brand-mark">
            <AppIcon icon="lucide:orbit" className="brand-mark-icon" />
          </div>
          {!isCollapsed && (
            <div className="brand-copy">
              <span className="brand-eyebrow">Control plane</span>
              <span className="brand-title">Job Orchestrator</span>
            </div>
          )}
        </div>
        <button className="toggle-btn" onClick={onToggle} aria-label="Alternar menu lateral">
          <AppIcon
            icon={isCollapsed ? 'lucide:panel-left-open' : 'lucide:panel-left-close'}
            className="toggle-icon"
          />
        </button>
      </div>

      {!isCollapsed && (
        <div className="sidebar-context">
          <div className="context-chip">
            <AppIcon icon="lucide:radio-tower" className="context-chip-icon" />
            <span>Local environment</span>
          </div>
          <div className="context-card">
            <div className="context-card-row">
              <span className="context-label">Transport</span>
              <span className="context-value">WebSocket</span>
            </div>
            <div className="context-card-row">
              <span className="context-label">Storage</span>
              <span className="context-value">SQLite</span>
            </div>
          </div>
        </div>
      )}

      <nav className="sidebar-nav">
        <div className="nav-section-title">{!isCollapsed ? 'Operate' : ''}</div>
        {primaryItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${item.isActive ? 'active' : ''}`}
            title={isCollapsed ? item.label : undefined}
          >
            <AppIcon icon={item.icon} className="nav-icon" />
            {!isCollapsed && (
              <span className="nav-copy">
                <span className="nav-label">{item.label}</span>
                <span className="nav-description">{item.description}</span>
              </span>
            )}
          </Link>
        ))}
      </nav>

      <div className="sidebar-footer">
        {!isCollapsed ? (
          <div className="sidebar-footer-card">
            <AppIcon icon="lucide:sparkles" className="footer-icon" />
            <div>
              <div className="footer-title">Developer-first runtime</div>
              <div className="footer-copy">Jobs, schedules and executions in one view.</div>
            </div>
          </div>
        ) : (
          <div className="sidebar-footer-collapsed">
            <AppIcon icon="lucide:sparkles" className="footer-icon" />
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
