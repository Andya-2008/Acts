import { useState } from 'react';

import { EasUpdateModal } from '@/features/app-update/EasUpdateModal';
import { useEasUpdate } from '@/features/app-update/useEasUpdate';

/** Checks EAS Update on launch and foreground; prompts to restart when a JS bundle is ready. */
export function EasUpdatePrompt() {
  const { offer, dismiss, applyUpdate } = useEasUpdate();
  const [applying, setApplying] = useState(false);

  if (!offer) {
    return null;
  }

  const onApply = () => {
    setApplying(true);
    void applyUpdate().catch(() => {
      setApplying(false);
    });
  };

  return <EasUpdateModal onApply={onApply} onDismiss={() => void dismiss()} applying={applying} />;
}
