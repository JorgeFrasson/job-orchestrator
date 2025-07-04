/**
 * Interface para o callback de disparo de jobs
 * Usado para evitar dependências circulares entre JobsService e JobTriggerManagerService
 */
export interface JobTriggerCallbackDto {
  /**
   * Tópico do job a ser disparado
   */
  topic: string;
  
  /**
   * Razão do disparo (ex: 'cron', 'dependsOn', 'manual')
   */
  reason: string;
  
  /**
   * Dados adicionais (opcional)
   */
  payload?: Record<string, any>;
}

/**
 * Tipo de função callback para disparar jobs
 */
export type JobTriggerCallback = (
  topic: string, 
  reason: string, 
  payload?: Record<string, any>
) => Promise<void>;
