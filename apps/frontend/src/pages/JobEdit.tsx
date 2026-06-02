import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { apiService } from '../services/api';
import { AppIcon } from '../components/AppIcon';
import { ErrorMessage } from '../components/ErrorMessage';
import { Loading } from '../components/Loading';
import type { Integration, JobConfig } from '../types/job.types';
import './JobEdit.css';

const JobEdit = () => {
  const { topic } = useParams<{ topic: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [cron, setCron] = useState('');
  const [retries, setRetries] = useState(3);
  const [timeout, setTimeout] = useState(30000);
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [showIntegrationModal, setShowIntegrationModal] = useState(false);
  const [editingIntegration, setEditingIntegration] = useState<Integration | null>(null);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', topic],
    queryFn: () => apiService.getJob(topic!),
    enabled: !!topic,
  });

  useEffect(() => {
    if (!job?.config) return;

    setCron(job.config.cron || '');
    setRetries(job.config.retries || 3);
    setTimeout(job.config.timeout || 30000);
    setIntegrations(job.config.integrations || []);
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
    setIntegrations(integrations.filter((integration) => integration.id !== id));
  };

  const handleSaveIntegration = (integration: Integration) => {
    if (editingIntegration) {
      setIntegrations(
        integrations.map((current) => (current.id === integration.id ? integration : current))
      );
    } else {
      setIntegrations([...integrations, { ...integration, id: Date.now().toString() }]);
    }

    setShowIntegrationModal(false);
  };

  if (isLoading) return <Loading message="Carregando editor do job..." />;
  if (!job?.topic) return <ErrorMessage message="Job não encontrado" />;

  return (
    <div className="job-edit-container">
      <div className="page-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/')}>
            <AppIcon icon="lucide:arrow-left" className="back-icon" />
            <span>Voltar</span>
          </button>
          <h1>Editar Job</h1>
          <p className="page-subtitle">{topic}</p>
        </div>
      </div>

      <div className="edit-sections">
        <section className="edit-section">
          <div className="section-header">
            <h2>
              <AppIcon icon="lucide:sliders-horizontal" className="section-icon" />
              Configurações
            </h2>
            <p className="section-description">
              Ajuste agendamento, retries e timeout do worker registrado.
            </p>
          </div>

          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="topic">Tópico</label>
              <input type="text" id="topic" value={job.topic} disabled className="form-input disabled" />
            </div>

            <div className="form-group">
              <label htmlFor="service">Serviço</label>
              <input
                type="text"
                id="service"
                value={job.service || job.serviceName || ''}
                disabled
                className="form-input disabled"
              />
            </div>

            <div className="form-group full-width">
              <label htmlFor="cron">
                Expressão cron
                <span className="label-hint">Deixe vazio para execução manual</span>
              </label>
              <input
                type="text"
                id="cron"
                value={cron}
                onChange={(event) => setCron(event.target.value)}
                placeholder="*/10 * * * * *"
                className="form-input"
              />
              <small className="help-text">Exemplo: */10 * * * * * (a cada 10 segundos)</small>
            </div>

            <div className="form-group">
              <label htmlFor="retries">Retries</label>
              <input
                type="number"
                id="retries"
                value={retries}
                onChange={(event) => setRetries(Number(event.target.value))}
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
                onChange={(event) => setTimeout(Number(event.target.value))}
                min="1000"
                step="1000"
                className="form-input"
              />
            </div>
          </div>

          <div className="section-actions">
            <button
              className="button button-primary"
              onClick={handleSaveConfig}
              disabled={updateConfigMutation.isPending}
            >
              <AppIcon icon="lucide:save" className="button-icon" />
              {updateConfigMutation.isPending ? 'Salvando...' : 'Salvar configurações'}
            </button>
          </div>
        </section>

        <section className="edit-section">
          <div className="section-header">
            <h2>
              <AppIcon icon="lucide:plug-zap" className="section-icon" />
              Integrações
            </h2>
            <p className="section-description">
              Configure webhooks ou funções JavaScript para eventos de lifecycle.
            </p>
          </div>

          <div className="integrations-list">
            {integrations.length === 0 ? (
              <div className="empty-integrations">
                <div className="empty-icon">
                  <AppIcon icon="lucide:plug-zap" className="empty-icon-svg" />
                </div>
                <p>Nenhuma integração configurada</p>
                <small>Adicione webhooks ou funções Lambda para onStart e onFinish.</small>
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
            <button className="button button-secondary" onClick={handleAddIntegration}>
              <AppIcon icon="lucide:plus" className="button-icon" />
              Adicionar integração
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

const IntegrationCard = ({ integration, onEdit, onDelete }: IntegrationCardProps) => (
  <div className="integration-card">
    <div className="integration-header">
      <div className="integration-info">
        <span className={`integration-type ${integration.type}`}>
          <AppIcon
            icon={integration.type === 'lambda' ? 'lucide:bolt' : 'lucide:globe'}
            className="integration-badge-icon"
          />
          {integration.type === 'lambda' ? 'Lambda JS' : 'Webhook'}
        </span>
        <span className={`integration-event ${integration.event}`}>
          <AppIcon
            icon={integration.event === 'onStart' ? 'lucide:play' : 'lucide:check-check'}
            className="integration-badge-icon"
          />
          {integration.event}
        </span>
      </div>

      <div className="integration-actions">
        <button className="icon-btn" onClick={onEdit} title="Editar">
          <AppIcon icon="lucide:pencil-line" className="action-icon" />
        </button>
        <button className="icon-btn danger" onClick={onDelete} title="Excluir">
          <AppIcon icon="lucide:trash-2" className="action-icon" />
        </button>
      </div>
    </div>

    <div className="integration-content">
      {integration.type === 'lambda' ? (
        <pre className="code-preview">
          {(integration.config as { code: string }).code.slice(0, 100)}
          {(integration.config as { code: string }).code.length > 100 ? '...' : ''}
        </pre>
      ) : (
        <div className="webhook-preview">
          <code>{(integration.config as { url: string }).url}</code>
        </div>
      )}
    </div>
  </div>
);

interface IntegrationModalProps {
  integration: Integration | null;
  onSave: (integration: Integration) => void;
  onClose: () => void;
}

const IntegrationModal = ({ integration, onSave, onClose }: IntegrationModalProps) => {
  const [type, setType] = useState<'lambda' | 'webhook'>(integration?.type || 'lambda');
  const [event, setEvent] = useState<'onStart' | 'onFinish'>(integration?.event || 'onStart');
  const [lambdaCode, setLambdaCode] = useState(
    integration?.type === 'lambda' ? (integration.config as { code: string }).code : ''
  );
  const [webhookUrl, setWebhookUrl] = useState(
    integration?.type === 'webhook' ? (integration.config as { url: string }).url : ''
  );
  const [webhookMethod, setWebhookMethod] = useState<'POST' | 'GET' | 'PUT'>(
    integration?.type === 'webhook'
      ? (integration.config as { method: 'POST' | 'GET' | 'PUT' }).method
      : 'POST'
  );
  const [webhookPayload, setWebhookPayload] = useState(
    integration?.type === 'webhook'
      ? (integration.config as { payload?: string }).payload || ''
      : ''
  );

  const handleSave = () => {
    const nextIntegration: Integration = {
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

    onSave(nextIntegration);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <h3>{integration ? 'Editar integração' : 'Nova integração'}</h3>
          <button className="close-btn" onClick={onClose}>
            <AppIcon icon="lucide:x" className="close-icon" />
          </button>
        </div>

        <div className="modal-body">
          <div className="form-group">
            <label>Tipo de integração</label>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  value="lambda"
                  checked={type === 'lambda'}
                  onChange={() => setType('lambda')}
                />
                <span>Lambda JavaScript</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="webhook"
                  checked={type === 'webhook'}
                  onChange={() => setType('webhook')}
                />
                <span>Webhook HTTP</span>
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
                <span>onStart (antes da execução)</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  value="onFinish"
                  checked={event === 'onFinish'}
                  onChange={() => setEvent('onFinish')}
                />
                <span>onFinish (após a execução)</span>
              </label>
            </div>
          </div>

          {type === 'lambda' ? (
            <div className="form-group">
              <label htmlFor="lambda-code">
                Código JavaScript
                <span className="label-hint">Use as variáveis: job, payload, context</span>
              </label>
              <textarea
                id="lambda-code"
                value={lambdaCode}
                onChange={(event) => setLambdaCode(event.target.value)}
                placeholder={`// Exemplo:\nconsole.log('Job iniciado:', job.topic);\nconsole.log('Payload:', payload);`}
                className="code-editor"
                rows={10}
              />
            </div>
          ) : (
            <>
              <div className="form-group">
                <label htmlFor="webhook-url">URL do webhook</label>
                <input
                  type="url"
                  id="webhook-url"
                  value={webhookUrl}
                  onChange={(event) => setWebhookUrl(event.target.value)}
                  placeholder="https://api.example.com/webhook"
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label htmlFor="webhook-method">Método HTTP</label>
                <select
                  id="webhook-method"
                  value={webhookMethod}
                  onChange={(event) =>
                    setWebhookMethod(event.target.value as 'POST' | 'GET' | 'PUT')
                  }
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
                  onChange={(event) => setWebhookPayload(event.target.value)}
                  placeholder={`{\n  "topic": "{{job.topic}}",\n  "service": "{{job.serviceName}}",\n  "data": {{payload}}\n}`}
                  className="code-editor"
                  rows={6}
                />
              </div>
            </>
          )}
        </div>

        <div className="modal-footer">
          <button className="button button-secondary" onClick={onClose}>
            Cancelar
          </button>
          <button className="button button-primary" onClick={handleSave}>
            <AppIcon icon="lucide:save" className="button-icon" />
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default JobEdit;
