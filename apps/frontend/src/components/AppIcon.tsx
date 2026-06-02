import { Icon } from '@iconify/react';

interface AppIconProps {
  icon: string;
  className?: string;
}

export function AppIcon({ icon, className }: AppIconProps) {
  return <Icon icon={icon} className={className} aria-hidden="true" />;
}
