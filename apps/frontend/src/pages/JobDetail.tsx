import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import './JobDetail.css';

export function JobDetail() {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [payload, setPayload] = useState('{}');
  const [isEditingConfig, setIsEditingConfig] = useState(false);
  const [configForm, setConfigForm] = useState({
    cron: '',
    retries: 0,
    dependsOn: '',
  });

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['job', topic],
    queryFn: () => apiService.getJob(topic!),
    enabled: !!topic,
  });

  const startJobMutation = useMutation({
    mutationFn: (data: { topic: string; payload: any }) =>
      apiService.startJob(data.topic, { payload: data.payload }),
    onSuccess: () => {
      alert('Job iniciado com sucesso!');
      setPayload('{}');
    },
    onError: (error) => {
      alert(`Erro ao iniciar job: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const updateConfigMutation = useMutation({
    mutationFn: (data: { topic: string; config: any }) =>
      apiService.updateJobConfig(data.topic, data.config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', topic] });
      setIsEditingConfig(false);
      alert('Configuração atualizada com sucesso!');
    },
    onError: (error) => {
      alert(`Erro ao atualizar configuração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    },
  });

  const handleStartJob = () => {
    if (!topic) return;
    
    try {
      const parsedPayload = JSON.parse(payload);
      startJobMutation.mutate({ topic, payload: parsedPayload });
    } catch (error) {
      alert('Payload JSON inválido');
    }
  };

  const handleUpdateConfig = () => {
    if (!topic) return;

    const config: any = {};
    
    if (configForm.cron.trim()) {
      config.cron = configForm.cron.trim();
    }
    
    if (configForm.retries > 0) {
      config.retries = configForm.retries;
    }
    
    if (configForm.dependsOn.trim()) {
      config.dependsOn = configForm.dependsOn
        .split(',')
        .map(d => d.trim())
        .filter(d => d);
    }

    updateConfigMutation.mutate({ topic, config });
  };

  if (isLoading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Carregando detalhes do job...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="error-container">
        <h2>❌ Erro ao carregar job</h2>
        <p>{error instanceof Error ? error.message : 'Job não encontrado'}</p>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Voltar para lista
        </button>
      </div>
    );
  }

  return (
    <div className="job-detail-container">
      <div className="detail-header">
        <button onClick={() => navigate('/')} className="back-button">
          ← Voltar
        </button>
        <h2>{job.topic}</h2>
      </div>

      <div className="detail-grid">
        {/* Info Card */}
        <div className="detail-card">
          <h3>📋 Informações</h3>
          <div className="info-group">
            <div className="info-item">
              <span className="info-label">Topic:</span>
              <span className="info-value">{job.topic}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Serviço:</span>
              <span className="info-value service-badge">{job.service || job.serviceName}</span>
            </div>
            <div className="info-item">
              <span className="info-label">Criado em:</span>
              <span className="info-value">
                {new Date(job.createdAt).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="info-item">
              <span className="info-label">Atualizado em:</span>
              <span className="info-value">
                {new Date(job.updatedAt).toLocaleString('pt-BR')}
              </span>
            </div>
          </div>
        </div>

        {/* Config Card */}
        <div className="detail-card">
          <div className="card-header">
            <h3>⚙️ Configuração</h3>
            <button 
              onClick={() => {
                if (isEditingConfig) {
                  setIsEditingConfig(false);
                } else {
                  setConfigForm({
                    cron: job.config?.cron || '',
                    retries: job.config?.retries || 0,
                    dependsOn: job.config?.dependsOn?.join(', ') || '',
                  });
                  setIsEditingConfig(true);
                }
              }}
              className="btn-icon"
            >
              {isEditingConfig ? '✕' : '✏️'}
            </button>
          </div>

          {!isEditingConfig ? (
            <div className="info-group">
              <div className="info-item">
                <span className="info-label">Cron:</span>
                <span className="info-value code">
                  {job.config?.cron || 'Não configurado'}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Retries:</span>
                <span className="info-value">
                  {job.config?.retries || 0}
                </span>
              </div>
              <div className="info-item">
                <span className="info-label">Dependências:</span>
                <span className="info-value">
                  {job.config?.dependsOn && job.config.dependsOn.length > 0
                    ? job.config.dependsOn.join(', ')
                    : 'Nenhuma'}
                </span>
              </div>
            </div>
          ) : (
            <div className="config-form">
              <div className="form-group">
                <label>Cron Expression:</label>
                <input
                  type="text"
                  value={configForm.cron}
                  onChange={(e) => setConfigForm({ ...configForm, cron: e.target.value })}
                  placeholder="0 * * * *"
                  className="form-input"
                />
                <small>Exemplo: 0 * * * * (todo início de hora)</small>
              </div>
              <div className="form-group">
                <label>Retries:</label>
                <input
                  type="number"
                  value={configForm.retries}
                  onChange={(e) => setConfigForm({ ...configForm, retries: parseInt(e.target.value) || 0 })}
                  min="0"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Dependências (separadas por vírgula):</label>
                <input
                  type="text"
                  value={configForm.dependsOn}
                  onChange={(e) => setConfigForm({ ...configForm, dependsOn: e.target.value })}
                  placeholder="job-1, job-2"
                  className="form-input"
                />
              </div>
              <button
                onClick={handleUpdateConfig}
                disabled={updateConfigMutation.isPending}
                className="btn btn-primary"
              >
                {updateConfigMutation.isPending ? 'Salvando...' : 'Salvar Configuração'}
              </button>
            </div>
          )}
        </div>

        {/* Trigger Card */}
        <div className="detail-card full-width">
          <h3>🚀 Disparar Job Manualmente</h3>
          <div className="trigger-form">
            <div className="form-group">
              <label>Payload (JSON):</label>
              <textarea
                value={payload}
                onChange={(e) => setPayload(e.target.value)}
                placeholder='{"key": "value"}'
                className="form-textarea"
                rows={6}
              />
            </div>
            <button
              onClick={handleStartJob}
              disabled={startJobMutation.isPending}
              className="btn btn-success"
            >
              {startJobMutation.isPending ? 'Iniciando...' : '▶️ Iniciar Job'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
