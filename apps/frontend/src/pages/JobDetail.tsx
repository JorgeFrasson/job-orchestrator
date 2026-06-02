import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { AppIcon } from '../components/AppIcon';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import './JobDetail.css';

export function JobDetail() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const [payload, setPayload] = useState('{}');
  const [feedback, setFeedback] = useState<string | null>(null);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', topic],
    queryFn: () => apiService.getJob(topic!),
    enabled: !!topic,
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['job-executions', topic],
    queryFn: () => apiService.getJobExecutions(topic!),
    enabled: !!topic,
    refetchInterval: 5000,
  });

  const startJobMutation = useMutation({
    mutationFn: (data: { topic: string; payload: unknown }) =>
      apiService.startJob(data.topic, { payload: data.payload }),
    onSuccess: () => {
      setFeedback('Execução enviada para o worker com sucesso.');
      setPayload('{}');
    },
    onError: (mutationError) => {
      setFeedback(
        `Falha ao iniciar job: ${
          mutationError instanceof Error ? mutationError.message : 'Erro desconhecido'
        }`
      );
    },
  });

  const handleStartJob = () => {
    if (!topic) return;

    try {
      const parsedPayload = JSON.parse(payload);
      setFeedback(null);
      startJobMutation.mutate({ topic, payload: parsedPayload });
    } catch {
      setFeedback('Payload JSON inválido.');
    }
  };

  if (isLoading) return <Loading message="Carregando detalhes operacionais..." />;
  if (error || !job) {
    return (
      <ErrorMessage
        message={error instanceof Error ? error.message : 'Job não encontrado'}
      />
    );
  }

  return (
    <div className="job-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/')} className="back-button">
          <AppIcon icon="lucide:arrow-left" className="back-icon" />
          <span>Voltar</span>
        </button>

        <div className="detail-header-copy">
          <div className="eyebrow">
            <AppIcon icon="lucide:activity" className="eyebrow-icon" />
            Job control plane
          </div>
          <h1>{job.topic}</h1>
          <p>Inspecione configuração, dispare manualmente e acompanhe execuções recentes.</p>
        </div>

        <button
          className="button button-secondary"
          onClick={() => navigate(`/jobs/${job.topic}/edit`)}
        >
          <AppIcon icon="lucide:settings-2" className="button-icon" />
          Editar
        </button>
      </div>

      <div className="detail-grid">
        <div className="detail-card">
          <div className="card-title">
            <AppIcon icon="lucide:file-stack" className="card-title-icon" />
            <h3>Contexto</h3>
          </div>

          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Topic</span>
              <span className="info-value">{job.topic}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Service</span>
              <span className="info-value service-badge">{job.service || job.serviceName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Criado em</span>
              <span className="info-value">
                {new Date(job.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Atualizado em</span>
              <span className="info-value">
                {new Date(job.updatedAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <div className="card-title">
            <AppIcon icon="lucide:sliders-horizontal" className="card-title-icon" />
            <h3>Configuração</h3>
          </div>

          <div className="config-list">
            <div className="config-row">
              <span>Cron</span>
              <code>{job.config?.cron || 'manual'}</code>
            </div>
            <div className="config-row">
              <span>Retries</span>
              <strong>{job.config?.retries || 0}</strong>
            </div>
            <div className="config-row">
              <span>Timeout</span>
              <strong>{job.config?.timeout || 0} ms</strong>
            </div>
            <div className="config-row">
              <span>Dependências</span>
              <strong>
                {job.config?.dependsOn?.length ? job.config.dependsOn.join(', ') : 'Nenhuma'}
              </strong>
            </div>
          </div>
        </div>

        <div className="detail-card full-width">
          <div className="card-title">
            <AppIcon icon="lucide:play" className="card-title-icon" />
            <h3>Manual trigger</h3>
          </div>

          <div className="trigger-form">
            <div className="form-group">
              <label>Payload (JSON)</label>
              <textarea
                value={payload}
                onChange={(event) => setPayload(event.target.value)}
                placeholder='{"key": "value"}'
                className="form-textarea"
                rows={6}
              />
            </div>
            {feedback && <div className="feedback-banner">{feedback}</div>}
            <button
              onClick={handleStartJob}
              disabled={startJobMutation.isPending}
              className="button button-primary"
            >
              <AppIcon icon="lucide:rocket" className="button-icon" />
              {startJobMutation.isPending ? 'Enviando...' : 'Iniciar job'}
            </button>
          </div>
        </div>

        <div className="detail-card full-width">
          <div className="card-title">
            <AppIcon icon="lucide:list-collapse" className="card-title-icon" />
            <h3>Execuções recentes</h3>
          </div>

          {executions.length === 0 ? (
            <p className="empty-copy">Nenhuma execução registrada ainda.</p>
          ) : (
            <div className="executions-table">
              {executions.map((execution) => (
                <div className="execution-row" key={execution.executionId}>
                  <div className="execution-main">
                    <code>{execution.executionId}</code>
                    <span className={`execution-status ${execution.status}`}>
                      {execution.status}
                    </span>
                  </div>
                  <div className="execution-meta">
                    <span>{new Date(execution.createdAt).toLocaleString('pt-BR')}</span>
                    <span>{execution.errorMessage || 'Sem erro reportado'}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
