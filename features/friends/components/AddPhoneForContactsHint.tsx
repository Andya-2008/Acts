import { router, type Href } from 'expo-router';
import { Pressable } from 'react-native';

import { AppText } from '@/shared/components/ui';

type AddPhoneForContactsHintProps = {
  className?: string;
};

/** Nudge users without a profile phone — contact matching works best with one saved. */
export function AddPhoneForContactsHint({ className = '' }: AddPhoneForContactsHintProps) {
  return (
    <Pressable
      className={className}
      accessibilityRole="button"
      accessibilityLabel="Add mobile number in Account settings"
      onPress={() => router.push('/(app)/settings/account' as Href)}>
      <AppText variant="caption" className="leading-5 text-acts-muted">
        Optional: add your mobile number in{' '}
        <AppText variant="caption" className="font-semibold text-acts-green">
          Account settings
        </AppText>{' '}
        so people who know you can find you from contacts.
      </AppText>
    </Pressable>
  );
}
