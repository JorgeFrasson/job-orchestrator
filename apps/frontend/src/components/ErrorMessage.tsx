import { AppIcon } from './AppIcon';
import './ErrorMessage.css';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ 
  title = 'Erro', 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="error-container">
      <div className="error-icon-wrap">
        <AppIcon icon="lucide:triangle-alert" className="error-icon" />
      </div>
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="button button-primary">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
