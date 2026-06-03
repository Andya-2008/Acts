import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, View } from 'react-native';

import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';

import { AppText } from './AppText';

export function showInfoMessage(title: string, message: string) {
  Alert.alert(title, message, [{ text: 'OK' }]);
}

type InfoHintButtonProps = {
  /** Alert dialog title (usually the setting or section name). */
  title: string;
  message: string;
};

export function InfoHintButton({ title, message }: InfoHintButtonProps) {
  const act = useActAppearance();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`More information about ${title}`}
      hitSlop={10}
      onPress={() => showInfoMessage(title, message)}
      className="ml-1.5 shrink-0 rounded-full p-0.5 active:opacity-70">
      <Ionicons name="information-circle-outline" size={22} color={act.palette.muted} />
    </Pressable>
  );
}

type TitleWithInfoProps = {
  title: string;
  infoText?: string;
  variant?: 'title' | 'subtitle' | 'label';
  className?: string;
  /** When false, only the (i) button is shown (use under a nav header that already shows the title). */
  showTitle?: boolean;
};

/** Section or card heading with an optional info (i) control. */
export function TitleWithInfo({
  title,
  infoText,
  variant = 'subtitle',
  className,
  showTitle = true,
}: TitleWithInfoProps) {
  if (!infoText) {
    if (!showTitle) return null;
    return (
      <AppText variant={variant} className={`text-acts-ink ${className ?? ''}`}>
        {title}
      </AppText>
    );
  }

  if (!showTitle) {
    return (
      <View className={`mb-4 flex-row justify-end ${className ?? ''}`}>
        <InfoHintButton title={title} message={infoText} />
      </View>
    );
  }

  return (
    <View className={`min-w-0 flex-row items-center ${className ?? ''}`}>
      <AppText variant={variant} className="min-w-0 flex-1 text-acts-ink" numberOfLines={3}>
        {title}
      </AppText>
      <InfoHintButton title={title} message={infoText} />
    </View>
  );
}
