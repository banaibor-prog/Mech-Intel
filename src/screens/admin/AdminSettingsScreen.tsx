import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Button from '../../components/Button';
import Chip from '../../components/ui/Chip';
import TextField from '../../components/ui/TextField';
import AnnouncementBanner from '../../components/home/AnnouncementBanner';
import { AdminGate, SectionLabel, timeAgo, useAdminActor } from '../../components/admin/AdminUI';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAppConfig } from '../../context/AppConfigContext';
import { logConfigChange } from '../../services/adminService';
import { saveAppConfig } from '../../services/appConfigService';
import { AnnouncementTone, AppConfig } from '../../types/models';
import { HomeStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AdminSettings'>;

const TONES: { value: AnnouncementTone; label: string }[] = [
  { value: 'info', label: 'Info' },
  { value: 'success', label: 'Good news' },
  { value: 'warning', label: 'Warning' },
];

export default function AdminSettingsScreen(props: Props) {
  return (
    <AdminGate>
      <Settings {...props} />
    </AdminGate>
  );
}

/** Lists which settings differ, for the activity log. */
function describeChanges(before: AppConfig, after: AppConfig): string[] {
  const out: string[] = [];
  if (before.maintenance.enabled !== after.maintenance.enabled) out.push(`maintenance ${after.maintenance.enabled ? 'on' : 'off'}`);
  else if (before.maintenance.message !== after.maintenance.message) out.push('maintenance message');
  if (before.announcement.active !== after.announcement.active) out.push(`announcement ${after.announcement.active ? 'published' : 'removed'}`);
  else if (
    before.announcement.title !== after.announcement.title ||
    before.announcement.message !== after.announcement.message ||
    before.announcement.tone !== after.announcement.tone
  )
    out.push('announcement text');
  if (before.allowNewPosts !== after.allowNewPosts) out.push(`new job posts ${after.allowNewPosts ? 'allowed' : 'paused'}`);
  if (before.showDemoContent !== after.showDemoContent) out.push(`demo content ${after.showDemoContent ? 'shown' : 'hidden'}`);
  if ((before.supportEmail ?? '') !== (after.supportEmail ?? '')) out.push('support email');
  return out;
}

function Settings({ navigation }: Props) {
  const actor = useAdminActor();
  const live = useAppConfig();
  const [draft, setDraft] = useState<AppConfig>(live);
  const [saving, setSaving] = useState(false);

  // Pick up changes saved elsewhere (another admin) while nothing is being edited.
  const changes = useMemo(() => describeChanges(live, draft), [live, draft]);
  useEffect(() => {
    if (changes.length === 0) setDraft(live);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live]);

  const set = <K extends keyof AppConfig>(key: K, value: AppConfig[K]) => setDraft((d) => ({ ...d, [key]: value }));
  const setAnnouncement = (patch: Partial<AppConfig['announcement']>) => setDraft((d) => ({ ...d, announcement: { ...d.announcement, ...patch } }));
  const setMaintenance = (patch: Partial<AppConfig['maintenance']>) => setDraft((d) => ({ ...d, maintenance: { ...d.maintenance, ...patch } }));

  const save = async () => {
    if (!actor || changes.length === 0) return;
    if (draft.announcement.active && !draft.announcement.title.trim() && !draft.announcement.message.trim()) {
      Alert.alert('Announcement is empty', 'Add a title or message, or switch the announcement off.');
      return;
    }
    const doSave = async () => {
      setSaving(true);
      try {
        await saveAppConfig(
          {
            maintenance: { enabled: draft.maintenance.enabled, message: draft.maintenance.message.trim() || live.maintenance.message },
            announcement: { ...draft.announcement, title: draft.announcement.title.trim(), message: draft.announcement.message.trim() },
            allowNewPosts: draft.allowNewPosts,
            showDemoContent: draft.showDemoContent,
            supportEmail: draft.supportEmail?.trim() ?? '',
          },
          actor.uid,
        );
        await logConfigChange(actor, `Updated settings: ${changes.join(', ')}`);
        Alert.alert('Saved', 'Changes are live for everyone now.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      } catch (e: any) {
        Alert.alert('Could not save', e?.message ?? 'Please try again.');
      } finally {
        setSaving(false);
      }
    };
    if (draft.maintenance.enabled && !live.maintenance.enabled) {
      Alert.alert('Turn on maintenance mode?', 'Everyone except admins will be locked out of the app until you switch it off.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Turn on', style: 'destructive', onPress: doSave },
      ]);
    } else {
      doSave();
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <SectionLabel title="Announcement" />
      <View style={styles.card}>
        <ToggleRow
          title="Show on Home"
          subtitle="A banner at the top of everyone's Home screen."
          value={draft.announcement.active}
          onChange={(v) => setAnnouncement({ active: v })}
        />
        <TextField label="Title" value={draft.announcement.title} onChangeText={(v) => setAnnouncement({ title: v })} placeholder="e.g. Khublei Shillong!" containerStyle={styles.field} />
        <TextField
          label="Message"
          value={draft.announcement.message}
          onChangeText={(v) => setAnnouncement({ message: v })}
          placeholder="What should everyone know?"
          multiline
          containerStyle={styles.field}
        />
        <Text style={styles.label}>Style</Text>
        <View style={styles.chips}>
          {TONES.map((t) => (
            <Chip key={t.value} label={t.label} active={draft.announcement.tone === t.value} onPress={() => setAnnouncement({ tone: t.value })} />
          ))}
        </View>
        {draft.announcement.title || draft.announcement.message ? (
          <>
            <Text style={styles.label}>Preview</Text>
            <View style={styles.preview}>
              <AnnouncementBanner title={draft.announcement.title} message={draft.announcement.message} tone={draft.announcement.tone} />
            </View>
          </>
        ) : null}
      </View>

      <SectionLabel title="Marketplace" />
      <View style={styles.card}>
        <ToggleRow
          title="Allow new job posts"
          subtitle="Turn off to pause posting (e.g. during spam waves). Admins can still post."
          value={draft.allowNewPosts}
          onChange={(v) => set('allowNewPosts', v)}
        />
        <View style={styles.divider} />
        <ToggleRow
          title="Show demo content"
          subtitle="Mix the built-in sample jobs and pros into the feed and map. Turn off once real listings fill the app."
          value={draft.showDemoContent}
          onChange={(v) => set('showDemoContent', v)}
        />
      </View>

      <SectionLabel title="Maintenance mode" />
      <View style={[styles.card, draft.maintenance.enabled && styles.cardDanger]}>
        <ToggleRow
          title="Lock the app"
          subtitle="Everyone except admins sees the message below instead of the app."
          value={draft.maintenance.enabled}
          onChange={(v) => setMaintenance({ enabled: v })}
        />
        <TextField label="Message" value={draft.maintenance.message} onChangeText={(v) => setMaintenance({ message: v })} multiline containerStyle={styles.field} />
      </View>

      <SectionLabel title="Support" />
      <View style={styles.card}>
        <TextField
          label="Support email"
          value={draft.supportEmail ?? ''}
          onChangeText={(v) => set('supportEmail', v)}
          placeholder="support@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          hint="Shown on the suspended-account and maintenance screens."
        />
      </View>

      {live.updatedAt ? <Text style={styles.updated}>Last changed {timeAgo(live.updatedAt)}</Text> : null}
      <Button
        title={changes.length ? `Save ${changes.length} change${changes.length === 1 ? '' : 's'}` : 'No changes'}
        onPress={save}
        loading={saving}
        disabled={changes.length === 0}
        style={styles.save}
      />
      {changes.length ? (
        <Button title="Discard changes" variant="ghost" onPress={() => setDraft(live)} style={styles.discard} />
      ) : null}
    </ScrollView>
  );
}

function ToggleRow({ title, subtitle, value, onChange }: { title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <View style={styles.toggle}>
      <View style={styles.flex}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleSubtitle}>{subtitle}</Text>
      </View>
      <Switch value={value} onValueChange={onChange} trackColor={{ false: Colors.borderStrong, true: Colors.accent }} thumbColor={Colors.white} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { padding: Spacing.md, paddingBottom: Spacing.xxl },
  flex: { flex: 1 },
  card: { backgroundColor: Colors.surface, borderRadius: 20, borderWidth: 1, borderColor: Colors.border, padding: 16 },
  cardDanger: { borderColor: Colors.error },
  toggle: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggleTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14.5 },
  toggleSubtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 17, marginTop: 2 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 14 },
  field: { marginTop: 14 },
  label: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 13, marginTop: 14, marginBottom: 8 },
  chips: { flexDirection: 'row', gap: 8 },
  preview: { marginHorizontal: -Spacing.md, marginTop: -18 },
  updated: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 12, marginTop: Spacing.lg, textAlign: 'center' },
  save: { marginTop: Spacing.md },
  discard: { marginTop: Spacing.xs },
});
