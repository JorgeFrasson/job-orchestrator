import React from 'react';
import './About.css';

const About: React.FC = () => {
  return (
    <div className="about-container">
      <div className="about-header">
        <h1>⚡ Job Orchestrator</h1>
        <p className="version">v1.0.0</p>
      </div>

      <div className="about-content">
        <section className="about-section">
          <h2>Sobre o Projeto</h2>
          <p>
            Sistema de orquestração de jobs distribuídos usando Kafka como message broker.
            Permite registro, agendamento e execução de jobs através de microserviços.
          </p>
        </section>

        <section className="about-section">
          <h2>Tecnologias</h2>
          <div className="tech-grid">
            <div className="tech-item">
              <span className="tech-icon">⚛️</span>
              <span>React 19</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">🟢</span>
              <span>NestJS</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">🐘</span>
              <span>PostgreSQL</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">📬</span>
              <span>Kafka</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">🐳</span>
              <span>Docker</span>
            </div>
            <div className="tech-item">
              <span className="tech-icon">⏰</span>
              <span>Node Cron</span>
            </div>
          </div>
        </section>

        <section className="about-section">
          <h2>Recursos</h2>
          <ul className="features-list">
            <li>✅ Registro automático de jobs via SDK</li>
            <li>✅ Agendamento com expressões cron</li>
            <li>✅ Execução manual via UI ou API</li>
            <li>✅ Lifecycle hooks (onStart, onFinish)</li>
            <li>✅ Integrações Lambda JS e Webhooks</li>
            <li>✅ Interface dark mode responsiva</li>
          </ul>
        </section>
      </div>
    </div>
  );
};

export default About;
