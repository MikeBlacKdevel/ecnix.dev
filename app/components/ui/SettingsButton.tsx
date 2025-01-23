import { memo } from 'react';
import { IconButton } from '~/components/ui/IconButton';

interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = memo(({ onClick }: SettingsButtonProps) => {
  return (
    <div className="group relative">
      <IconButton
        onClick={onClick}
        icon="i-ph:gear"
        size="xl"
        title="Ajustes"
        className="text-[#666] opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive/10"
      />
    </div>
  );
});