import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './JobList.css';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';

const JobList: React.FC = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiService.getJobs(),
    refetchInterval: 5000,
  });

  const handleStartJob = async (topic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiService.startJob(topic);
    } catch (error) {
      console.error('Failed to start job:', error);
    }
  };

  const handleEditJob = (topic: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/jobs/${topic}/edit`);
  };

  if (isLoading) return <Loading />;
  if (error) return <ErrorMessage message="Erro ao carregar jobs" />;

  const filteredJobs = jobs?.filter((job) =>
    job.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (job.service || job.serviceName || '').toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="job-list-container">
      <div className="page-header">
        <div>
          <h1>Jobs Registrados</h1>
          <p className="page-subtitle">
            Gerencie e monitore todos os jobs do orquestrador
          </p>
        </div>
        <div className="header-actions">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Buscar por tópico ou serviço..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
      </div>

      <div className="jobs-stats">
        <div className="stat-card">
          <div className="stat-value">{jobs?.length || 0}</div>
          <div className="stat-label">Total de Jobs</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {jobs?.filter(j => j.config?.cron).length || 0}
          </div>
          <div className="stat-label">Com Cron</div>
        </div>
        <div className="stat-card">
          <div className="stat-value">
            {jobs?.filter(j => j.isActive !== false).length || 0}
          </div>
          <div className="stat-label">Ativos</div>
        </div>
      </div>

      <div className="table-container">
        <table className="jobs-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Tópico</th>
              <th>Serviço</th>
              <th>Cron</th>
              <th className="text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  <div className="empty-icon">📭</div>
                  <div>Nenhum job encontrado</div>
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr key={job.topic} className="job-row">
                  <td>
                    <div className="status-badge">
                      <span className={`status-indicator ${job.isActive !== false ? 'active' : 'inactive'}`}></span>
                      {job.isActive !== false ? 'Ativo' : 'Inativo'}
                    </div>
                  </td>
                  <td>
                    <div className="topic-cell">
                      <span className="topic-name">{job.topic}</span>
                    </div>
                  </td>
                  <td>
                    <div className="service-cell">
                      <span className="service-icon">🔧</span>
                      <span>{job.service || job.serviceName}</span>
                    </div>
                  </td>
                  <td>
                    {job.config?.cron ? (
                      <code className="cron-badge">{job.config.cron}</code>
                    ) : (
                      <span className="text-muted">Manual</span>
                    )}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn play-btn"
                        onClick={(e) => handleStartJob(job.topic, e)}
                        title="Executar job manualmente"
                      >
                        ▶️
                      </button>
                      <button
                        className="action-btn edit-btn"
                        onClick={(e) => handleEditJob(job.topic, e)}
                        title="Editar job"
                      >
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default JobList;
