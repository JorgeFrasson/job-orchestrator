import './ErrorMessage.css';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
}

export function ErrorMessage({ 
  title = '❌ Erro', 
  message, 
  onRetry 
}: ErrorMessageProps) {
  return (
    <div className="error-container">
      <h2>{title}</h2>
      <p>{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn btn-primary">
          Tentar novamente
        </button>
      )}
    </div>
  );
}
