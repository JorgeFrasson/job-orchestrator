import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiService } from '../services/api';
import type { Integration, JobConfig } from '../types/job.types';
import { Loading } from '../components/Loading';
import { ErrorMessage } from '../components/ErrorMessage';
import './JobEdit.css';

const JobEdit: React.FC = () => {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cron, setCron] = useState('');
  const [retries, setRetries] = useState(3);
  const [timeout, setTimeout] = useState(30000);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const { data: job = {}, isLoading } = useQuery({
    queryKey: ['job', topic],
    queryFn: () => apiService.getJob(topic!),
    enabled: !!topic,
  });

  React.useEffect(() => {
    if (job && (job as any).config) {
      setCron((job as any).config?.cron || '');
      setRetries((job as any).config?.retries || 3);
      setTimeout((job as any).config?.timeout || 30000);
      setIntegrations((job as any).config?.integrations || []);
    }
  }, [job]);

  const updateConfigMutation = useMutation({
    mutationFn: (config: Partial<JobConfig>) => apiService.updateJobConfig(topic!, config),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', topic] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
    },
  });

  const handleSaveConfig = () => {
    updateConfigMutation.mutate({
      cron: cron || undefined,
      retries,
      timeout,
      integrations,
    });
  };

  const handleAddIntegration = () => {
    setEditingIntegration(null);
    setShowIntegrationModal(true);
  };

  const handleEditIntegration = (integration: Integration) => {
    setEditingIntegration(integration);
    setShowIntegrationModal(true);
  };

  const handleDeleteIntegration = (id: string) => {
    setIntegrations(integrations.filter((i) => i.id !== id));
  };

  const handleSaveIntegration = (integration: Integration) => {
    if (editingIntegration) {
      setIntegrations(integrations.map((i) => (i.id === integration.id ? integration : i)));
    } else {
      setIntegrations([...integrations, { ...integration, id: Date.now().toString() }]);
    }
    setShowIntegrationModal(false);
  };

  if (isLoading) return <Loading />;
  if (!job || !(job as any).topic) return <ErrorMessage message="Job não encontrado" />;

  const jobData = job as any;

  return (
    <div className="job-edit-container">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/')}>
            ← Voltar
          </button>
          <h1>Editar Job</h1>
          <p className="page-subtitle">{topic}</p>
        </div>
      </div>

      <div className="edit-sections">
        <section className="edit-section">
          <div className="section-header">
            <h2>⚙️ Configurações</h2>
            <p className="section-description">
              Configure o comportamento e agendamento do job
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="topic">Tópico</label>
              <input
                type="text"
                id="topic"
                value={jobData.topic}
                disabled
                className="form-input disabled"
              />
            </div>

            <div className="form-group">
              <label htmlFor="service">Serviço</label>
              <input
                type="text"
                id="service"
                value={jobData.service || jobData.serviceName || ''}
                disabled
                className="form-input disabled"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="cron">
                Expressão Cron
                <span className="label-hint">Deixe vazio para execução manual</span>
              </label>
              <input
                type="text"
                id="cron"
                value={cron}
                onChange={(e) => setCron(e.target.value)}
                placeholder="*/10 * * * * *"
                className="form-input"
              />
              <small className="help-text">
                Exemplo: */10 * * * * * (a cada 10 segundos)
              </small>
            </div>

            <div className="form-group">
              <label htmlFor="retries">Tentativas (Retries)</label>
              <input
                type="number"
                id="retries"
                value={retries}
                onChange={(e) => setRetries(Number(e.target.value))}
                min="0"
                max="10"
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="timeout">
                Timeout (ms)
                <span className="label-hint">Tempo máximo de execução</span>
              </label>
              <input
                type="number"
                id="timeout"
                value={timeout}
                onChange={(e) => setTimeout(Number(e.target.value))}
                min="1000"
                step="1000"
                className="form-input"
              />
            </div>
          </div>

          <div className="section-actions">
            <button
              className="btn btn-primary"
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
            >
              {updateConfigMutation.isPending ? 'Salvando...' : '💾 Salvar Configurações'}
            </button>
          </div>
        </section>

        <section className="edit-section">
          <div className="section-header">
            <h2>🔌 Integrações</h2>
            <p className="section-description">
              Configure webhooks ou funções JavaScript para eventos de lifecycle
            </p>
          </div>

          <div className="integrations-list">
            {integrations.length === 0 ? (
              <div className="empty-integrations">
                <div className="empty-icon">🔌</div>
                <p>Nenhuma integração configurada</p>
                <small>Adicione webhooks ou funções Lambda para onStart e onFinish</small>
              </div>
            ) : (
              integrations.map((integration) => (
                <IntegrationCard
                  key={integration.id}
                  integration={integration}
                  onEdit={() => handleEditIntegration(integration)}
                  onDelete={() => handleDeleteIntegration(integration.id)}
                />
              ))
            )}
          </div>

          <div className="section-actions">
            <button className="btn btn-secondary" onClick={handleAddIntegration}>
              ➕ Adicionar Integração
            </button>
          </div>
        </section>
      </div>

      {showIntegrationModal && (
        <IntegrationModal
          integration={editingIntegration}
          onSave={handleSaveIntegration}
          onClose={() => setShowIntegrationModal(false)}
        />
      )}
    </div>
  );
};

interface IntegrationCardProps {
  integration: Integration;
  onEdit: () => void;
  onDelete: () => void;
}

const IntegrationCard: React.FC<IntegrationCardProps> = ({ integration, onEdit, onDelete }) => {
  return (
    <div className="integration-card">
      <div className="integration-header">
        <div className="integration-info">
          <span className={`integration-type ${integration.type}`}>
            {integration.type === 'lambda' ? '⚡ Lambda JS' : '🌐 Webhook'}
          </span>
          <span className={`integration-event ${integration.event}`}>
            {integration.event === 'onStart' ? '▶️ onStart' : '✅ onFinish'}
          </span>
        </div>
        <div className="integration-actions">
          <button className="icon-btn" onClick={onEdit} title="Editar">
            ✏️
          </button>
          <button className="icon-btn danger" onClick={onDelete} title="Excluir">
            🗑️
          </button>
        </div>
      </div>
      <div className="integration-content">
        {integration.type === 'lambda' ? (
          <pre className="code-preview">
            {(integration.config as any).code.slice(0, 100)}
            {(integration.config as any).code.length > 100 ? '...' : ''}
          </pre>
        ) : (
          <div className="webhook-preview">
            <code>{(integration.config as any).url}</code>
          </div>
        )}
      </div>
    </div>
  );
};

interface IntegrationModalProps {
  integration: Integration | null;
  onSave: (integration: Integration) => void;
  onClose: () => void;
}

const IntegrationModal: React.FC<IntegrationModalProps> = ({ integration, onSave, onClose }) => {
  const [type, setType] = useState<'lambda' | 'webhook'>(integration?.type || 'lambda');
  const [event, setEvent] = useState<'onStart' | 'onFinish'>(integration?.event || 'onStart');
  const [lambdaCode, setLambdaCode] = useState(
    integration?.type === 'lambda' ? (integration.config as any).code : ''
  );
  const [webhookUrl, setWebhookUrl] = useState(
    integration?.type === 'webhook' ? (integration.config as any).url : ''
  );
  const [webhookMethod, setWebhookMethod] = useState<'POST' | 'GET' | 'PUT'>(
    integration?.type === 'webhook' ? (integration.config as any).method : 'POST'
  );
  const [webhookPayload, setWebhookPayload] = useState(
    integration?.type === 'webhook' ? (integration.config as any).payload || '' : ''
  );

  const handleSave = () => {
    const newIntegration: Integration = {
      id: integration?.id || Date.now().toString(),
      type,
      event,
      config:
        type === 'lambda'
          ? { code: lambdaCode }
          : {
              url: webhookUrl,
              method: webhookMethod,
              payload: webhookPayload,
            },
    };
    onSave(newIntegration);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{integration ? 'Editar Integração' : 'Nova Integração'}</h3>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tipo de Integração</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="lambda"
                  checked={type === 'lambda'}
                  onChange={() => setType('lambda')}
                />
                <span>⚡ Lambda JavaScript</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="webhook"
                  checked={type === 'webhook'}
                  onChange={() => setType('webhook')}
                />
                <span>🌐 Webhook HTTP</span>
              </label>
            </div>
          </div>

          <div className="form-group">
            <label>Evento</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="onStart"
                  checked={event === 'onStart'}
                  onChange={() => setEvent('onStart')}
                />
                <span>▶️ onStart (antes da execução)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="onFinish"
                  checked={event === 'onFinish'}
                  onChange={() => setEvent('onFinish')}
                />
                <span>✅ onFinish (após a execução)</span>
              </label>
            </div>
          </div>

          {type === 'lambda' ? (
            <div className="form-group">
              <label htmlFor="lambda-code">
                Código JavaScript
                <span className="label-hint">
                  Use as variáveis: job, payload, context
                </span>
              </label>
              <textarea
                id="lambda-code"
                value={lambdaCode}
                onChange={(e) => setLambdaCode(e.target.value)}
                placeholder={`// Exemplo:\nconsole.log('Job iniciado:', job.topic);\nconsole.log('Payload:', payload);`}
                className="code-editor"
                rows={10}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="webhook-url">URL do Webhook</label>
                <input
                  type="url"
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://api.example.com/webhook"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="webhook-method">Método HTTP</label>
                <select
                  id="webhook-method"
                  value={webhookMethod}
                  onChange={(e) => setWebhookMethod(e.target.value as any)}
                  className="form-select"
                >
                  <option value="POST">POST</option>
                  <option value="GET">GET</option>
                  <option value="PUT">PUT</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="webhook-payload">
                  Payload (opcional)
                  <span className="label-hint">
                    Use variáveis: {'{{job.topic}}'}, {'{{payload}}'}
                  </span>
                </label>
                <textarea
                  id="webhook-payload"
                  value={webhookPayload}
                  onChange={(e) => setWebhookPayload(e.target.value)}
                  placeholder={`{\n  "topic": "{{job.topic}}",\n  "service": "{{job.serviceName}}",\n  "data": {{payload}}\n}`}
                  className="code-editor"
                  rows={6}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            💾 Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobEdit;
