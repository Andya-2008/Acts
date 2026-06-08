import { AppStoreUpdateModal } from '@/features/app-update/AppStoreUpdateModal';
import { useAppStoreUpdate } from '@/features/app-update/useAppStoreUpdate';

/** Checks the App Store on launch and when returning to the app; prompts when a newer version is published. */
export function AppStoreUpdatePrompt() {
  const { offer, dismiss } = useAppStoreUpdate();

  if (!offer) {
    return null;
  }

  return <AppStoreUpdateModal offer={offer} onDismiss={() => void dismiss()} />;
}
