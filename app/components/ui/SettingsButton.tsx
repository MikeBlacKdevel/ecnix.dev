import { memo } from 'react';
import { IconButton } from '~/components/ui/IconButton';
interface SettingsButtonProps {
  onClick: () => void;
}

export const SettingsButton = memo(({ onClick }: SettingsButtonProps) => {
  return (
    <></> //Este es el boton de ajustes que estara desactivado, no se mostrara en la interfaz de usuario.

    /*{<IconButton
      onClick={onClick}
      icon="i-ph:gear"
      size="xl"
      title="Ajustes"
      className="text-[#666] hover:text-bolt-elements-textPrimary hover:bg-bolt-elements-item-backgroundActive/10 transition-colors"
    />}*/
  );
});
