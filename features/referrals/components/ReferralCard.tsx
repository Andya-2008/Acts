import { View, Pressable, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import Ionicons from '@expo/vector-icons/Ionicons';

import { AppText, AppButton } from '@/shared/components/ui';
import { useActAppearance } from '@/shared/providers/ActAppearanceProvider';
import { useAuthStore } from '@/shared/stores/authStore';
import { authorDisplayNameForDeed } from '@/features/deed-feed/utils/authorDisplayName';
import { useUserInfoQuery } from '@/features/user-profile/hooks/useUserInfoQuery';
import {
  useReferralCodeQuery,
  useReferralStatsQuery,
  useReferralHistoryQuery,
} from '@/features/referrals/hooks/useReferralQueries';
import { copyTextToClipboard, shareInviteLink } from '@/features/sharing/inviteShareActions';
import { getInviteShareMessage } from '@/shared/config/appInvite';

/**
 * Referral invite card
 * Shows user's unique referral code and lets them share it
 */
export function ReferralInviteCard() {
  const uid = useAuthStore((s) => s.user?.uid);
  const user = useAuthStore((s) => s.user);
  const { data: userInfo } = useUserInfoQuery(uid);
  const act = useActAppearance();
  const [sharing, setSharing] = useState(false);
  const [copied, setCopied] = useState(false);

  const profileDisplayName = authorDisplayNameForDeed(userInfo, user);
  const { data: referralCode, isLoading: codeLoading } = useReferralCodeQuery(
    uid,
    profileDisplayName !== 'Friend' ? profileDisplayName : userInfo?.Username,
  );
  const { data: stats } = useReferralStatsQuery(uid);

  if (!uid || !userInfo || !referralCode) return null;

  const shareMessage = `${getInviteShareMessage(uid)}\n\nReferral code: ${referralCode}`;

  const handleShare = async () => {
    try {
      setSharing(true);
      await shareInviteLink(uid, 'Join Acts with my referral code');
    } catch {
      // User dismissed share sheet — no alert needed.
    } finally {
      setSharing(false);
    }
  };

  const handleCopyLink = async () => {
    await copyTextToClipboard(shareMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyCode = async () => {
    await copyTextToClipboard(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View
      style={{
        backgroundColor: act.palette.surface,
        borderWidth: 1,
        borderColor: act.palette.green + '30',
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
      }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <Ionicons name="gift-outline" size={20} color={act.palette.green} />
        <AppText variant="label" className="font-semibold" style={{ color: act.palette.ink }}>
          Share & Earn XP
        </AppText>
      </View>

      {/* Referral Code Box */}
      <Pressable
        onPress={() => void handleCopyCode()}
        accessibilityRole="button"
        accessibilityLabel={`Copy referral code ${referralCode}`}
        style={{
          backgroundColor: act.palette.ink + '05',
          borderRadius: 8,
          padding: 12,
          marginBottom: 12,
          alignItems: 'center',
        }}>
        <AppText variant="body" className="text-xs" style={{ color: act.palette.muted }}>
          Your referral code · tap to copy
        </AppText>
        <AppText
          variant="subtitle"
          className="text-lg font-bold font-mono tracking-widest"
          style={{ color: act.palette.green, marginTop: 4 }}>
          {referralCode}
        </AppText>
      </Pressable>

      {/* Description */}
      <AppText
        variant="body"
        className="text-xs"
        style={{ color: act.palette.muted, marginBottom: 12, lineHeight: 18 }}>
        Share your invite link with friends. When they sign up and complete 5 tasks, you both get rewards:
        {'\n'}✓ You get +100 XP{'\n'}✓ They get +500 XP welcome bonus
      </AppText>

      {/* Stats */}
      {stats && (
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 12 }}>
          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: act.palette.ink + '05', borderRadius: 8 }}>
            <AppText variant="label" className="font-bold" style={{ color: act.palette.green }}>
              {stats.completedReferrals}
            </AppText>
            <AppText variant="body" className="text-xs" style={{ color: act.palette.muted }}>
              Friends Joined
            </AppText>
          </View>

          <View style={{ flex: 1, alignItems: 'center', paddingVertical: 8, backgroundColor: act.palette.ink + '05', borderRadius: 8 }}>
            <AppText variant="label" className="font-bold" style={{ color: act.palette.green }}>
              +{stats.totalRewardsEarned}
            </AppText>
            <AppText variant="body" className="text-xs" style={{ color: act.palette.muted }}>
              XP Earned
            </AppText>
          </View>
        </View>
      )}

      {/* Buttons */}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <AppButton
          title="Share invite"
          onPress={handleShare}
          disabled={sharing || codeLoading}
          loading={sharing}
          style={{ flex: 1 }}
        />
        <AppButton
          title={copied ? 'Copied!' : 'Copy link'}
          onPress={handleCopyLink}
          variant="secondary"
          style={{ flex: 1 }}
        />
      </View>
    </View>
  );
}

/**
 * Referral history list
 * Shows who the user referred
 */
export function ReferralHistoryList() {
  const uid = useAuthStore((s) => s.user?.uid);
  const act = useActAppearance();

  const { data: history = [], isLoading } = useReferralHistoryQuery(uid);

  if (!uid || history.length === 0) return null;

  return (
    <View>
      <AppText variant="label" className="font-semibold" style={{ color: act.palette.ink, marginBottom: 8 }}>
        Friends You Referred ({history.length})
      </AppText>

      {history.map((referral) => (
        <View
          key={referral.id}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 10,
            paddingHorizontal: 12,
            borderBottomWidth: 1,
            borderBottomColor: act.palette.border,
          }}>
          <View style={{ flex: 1 }}>
            <AppText variant="body" className="font-medium" style={{ color: act.palette.ink }}>
              Friend #{referral.id.substring(0, 8)}
            </AppText>
            <AppText
              variant="body"
              className="text-xs"
              style={{ color: act.palette.muted, marginTop: 2 }}>
              {referral.tasksCompleted}/5 tasks completed
            </AppText>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            {referral.rewardClaimed ? (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="checkmark-circle" size={20} color={act.palette.green} />
                <AppText variant="body" className="text-xs" style={{ color: act.palette.green, marginTop: 2 }}>
                  Reward earned
                </AppText>
              </View>
            ) : referral.tasksCompleted === 5 ? (
              <View style={{ alignItems: 'center' }}>
                <Ionicons name="star" size={20} color={act.palette.green} />
                <AppText variant="body" className="text-xs" style={{ color: act.palette.green, marginTop: 2 }}>
                  Unlocked!
                </AppText>
              </View>
            ) : (
              <AppText
                variant="body"
                className="text-xs font-medium"
                style={{ color: act.palette.muted }}>
                {5 - referral.tasksCompleted} to go
              </AppText>
            )}
          </View>
        </View>
      ))}
    </View>
  );
}
