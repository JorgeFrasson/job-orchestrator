import { Link } from 'react-router-dom';
import './Header.css';

export function Header() {
  return (
    <header className="header">
      <div className="header-container">
        <div className="header-brand">
          <Link to="/" className="brand-link">
            <span className="brand-icon">⚡</span>
            <h1>Job Orchestrator</h1>
          </Link>
        </div>
        <nav className="header-nav">
          <Link to="/" className="nav-link">Jobs</Link>
          <Link to="/about" className="nav-link">Sobre</Link>
        </nav>
      </div>
    </header>
  );
}
