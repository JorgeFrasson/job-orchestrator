import { AppIcon } from '../components/AppIcon';
import './About.css';

const techItems = [
  { label: 'React 19', icon: 'lucide:panels-top-left' },
  { label: 'NestJS', icon: 'lucide:shield' },
  { label: 'SQLite', icon: 'lucide:database' },
  { label: 'WebSocket', icon: 'lucide:radio-tower' },
  { label: 'Docker', icon: 'lucide:container' },
  { label: 'Node Cron', icon: 'lucide:clock-3' },
];

const About = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <div className="about-mark">
          <AppIcon icon="lucide:orbit" className="about-mark-icon" />
        </div>
        <h1>Job Orchestrator</h1>
        <p className="version">v1.0.0</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Sobre o Projeto</h2>
          <p>
            Sistema de orquestração de jobs distribuídos com core centralizado, comunicação
            WebSocket entre SDK e runtime e persistência local em SQLite por padrão.
          </p>
        </section>

        <section className="about-section">
          <h2>Tecnologias</h2>
          <div className="tech-grid">
            {techItems.map((item) => (
              <div className="tech-item" key={item.label}>
                <AppIcon icon={item.icon} className="tech-icon" />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="about-section">
          <h2>Recursos</h2>
          <ul className="features-list">
            <li>Registro automático de jobs via SDK Node.</li>
            <li>Agendamento por cron e disparo manual sob demanda.</li>
            <li>Histórico de execuções com status, payload e falhas.</li>
            <li>Hooks de ciclo de vida com integrações Lambda JS e webhook.</li>
            <li>Ambiente local simples, com Docker opcional para o core e workers.</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default About;
