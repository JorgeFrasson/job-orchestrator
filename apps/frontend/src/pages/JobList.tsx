import type { MouseEvent } from 'react';
import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { AppIcon } from '../components/AppIcon';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import './JobList.css';

const JobList = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => apiService.getJobs(),
    refetchInterval: 5000,
  });

  const filteredJobs = useMemo(
    () =>
      jobs?.filter((job) => {
        const serviceName = job.service || job.serviceName || '';
        const query = searchTerm.toLowerCase();

        return (
          job.topic.toLowerCase().includes(query) || serviceName.toLowerCase().includes(query)
        );
      }) || [],
    [jobs, searchTerm]
  );

  const totalJobs = jobs?.length || 0;
  const scheduledJobs = jobs?.filter((job) => job.config?.cron).length || 0;

  const handleStartJob = async (topic: string, event: MouseEvent) => {
    event.stopPropagation();

    try {
      await apiService.startJob(topic);
    } catch (startError) {
      console.error('Failed to start job:', startError);
    }
  };

  const handleEditJob = (topic: string, event: MouseEvent) => {
    event.stopPropagation();
    navigate(`/jobs/${topic}/edit`);
  };

  if (isLoading) return <Loading message="Carregando plano de jobs..." />;
  if (error) return <ErrorMessage message="Não foi possível carregar a listagem de jobs." />;

  return (
    <div className="job-list-container">
      <section className="jobs-toolbar">
        <div className="jobs-toolbar-copy">
          <div className="eyebrow">
            <AppIcon icon="lucide:list-filter" className="eyebrow-icon" />
            Registry
          </div>
          <h1>Jobs</h1>
          <p className="page-subtitle">
            Registro central de workers, agendamentos e execuções.
          </p>
        </div>

        <div className="jobs-toolbar-actions">
          <div className="search-box">
            <AppIcon icon="lucide:search" className="search-icon" />
            <input
              type="text"
              placeholder="Filtrar por tópico ou serviço"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="search-input"
            />
          </div>
          <div className="toolbar-summary">
            <span>{totalJobs} total</span>
            <span>{scheduledJobs} com cron</span>
            <span>{filteredJobs.length} visíveis</span>
          </div>
        </div>
      </section>

      <section className="jobs-panel">
        <div className="panel-header">
          <div>
            <h2>Registry</h2>
            <p>Selecione um job para ver detalhes, configurações e histórico.</p>
          </div>
          <div className="panel-meta">{filteredJobs.length} visíveis</div>
        </div>

        <table className="jobs-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Tópico</th>
              <th>Serviço</th>
              <th>Trigger</th>
              <th>State</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredJobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="empty-state">
                  <div className="empty-icon-wrap">
                    <AppIcon icon="lucide:inbox" className="empty-icon" />
                  </div>
                  <div>Nenhum job encontrado</div>
                </td>
              </tr>
            ) : (
              filteredJobs.map((job) => (
                <tr
                  key={job.topic}
                  className="job-row"
                  onClick={() => navigate(`/jobs/${job.topic}`)}
                >
                  <td>
                    <div className="job-name-cell">
                      <div>
                        <div className="job-title">{job.topic.split('-')[0] || job.topic}</div>
                        <div className="job-subtitle">Registered worker task</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <code className="topic-name">{job.topic}</code>
                  </td>
                  <td>
                    <div className="service-cell">
                      <AppIcon icon="lucide:container" className="service-icon" />
                      <span>{job.service || job.serviceName}</span>
                    </div>
                  </td>
                  <td>
                    {job.config?.cron ? (
                      <code className="cron-badge">{job.config.cron}</code>
                    ) : (
                      <span className="mode-badge">Manual</span>
                    )}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${job.isActive !== false ? 'active' : 'inactive'}`}
                    >
                      <span className="status-dot" />
                      {job.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons">
                      <button
                        className="action-btn"
                        onClick={(event) => handleStartJob(job.topic, event)}
                        title="Executar job manualmente"
                      >
                        <AppIcon icon="lucide:play" className="action-icon" />
                      </button>
                      <button
                        className="action-btn"
                        onClick={(event) => {
                          event.stopPropagation();
                          navigate(`/jobs/${job.topic}`);
                        }}
                        title="Abrir job"
                      >
                        <AppIcon icon="lucide:arrow-up-right" className="action-icon" />
                      </button>
                      <button
                        className="action-btn"
                        onClick={(event) => handleEditJob(job.topic, event)}
                        title="Editar job"
                      >
                        <AppIcon icon="lucide:settings-2" className="action-icon" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>
    </div>
  );
};

export default JobList;
