import { AppIcon } from './AppIcon';
import './Loading.css';

interface LoadingProps {
  message?: string;
}

export function Loading({ message = 'Carregando...' }: LoadingProps) {
  return (
    <div className="loading-container">
      <div className="loading-badge">
        <AppIcon icon="lucide:loader-circle" className="spinner" />
      </div>
      <p>{message}</p>
    </div>
  );
}
