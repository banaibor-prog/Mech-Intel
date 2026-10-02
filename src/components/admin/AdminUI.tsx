import React, { useCallback, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import AppIcon, { AppIconName } from '../AppIcon';
import Button from '../Button';
import GycLogo from '../brand/GycLogo';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { AdminActor } from '../../services/adminService';

// Small, shared building blocks for the admin console screens.

export function useAdminActor(): AdminActor | null {
  const { user, profile } = useAuth();
  if (!user || !profile?.isAdmin) return null;
  return { uid: user.uid, name: profile.displayName || user.email || 'Admin' };
}

/** Renders children only for admins; everyone else sees a short notice. */
export function AdminGate({ children }: { children: React.ReactNode }) {
  const { profile } = useAuth();
  if (profile?.isAdmin) return <>{children}</>;
  return (
    <View style={styles.gate}>
      <GycLogo size={80} />
      <Text style={styles.gateTitle}>Admins only</Text>
      <Text style={styles.gateText}>You don't have access to the admin console.</Text>
    </View>
  );
}

export function formatDate(ts?: number) {
  if (!ts) return '—';
  return new Date(ts).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function timeAgo(ts?: number) {
  if (!ts) return '—';
  const mins = Math.max(1, Math.round((Date.now() - ts) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(ts);
}

export function StatTile({ label, value, hint, onPress }: { label: string; value: number | string; hint?: string; onPress?: () => void }) {
  return (
    <TouchableOpacity style={styles.stat} onPress={onPress} disabled={!onPress} activeOpacity={0.8} accessibilityRole={onPress ? 'button' : undefined}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
      {hint ? <Text style={styles.statHint}>{hint}</Text> : null}
    </TouchableOpacity>
  );
}

export function SectionLabel({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <View style={styles.sectionRow}>
      <Text style={styles.sectionLabel}>{title}</Text>
      {right}
    </View>
  );
}

type Tone = 'neutral' | 'info' | 'success' | 'warning' | 'danger';
const TONES: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: '#F1F5F9', fg: Colors.textLight },
  info: { bg: Colors.accentSoft, fg: Colors.accent },
  success: { bg: Colors.successSoft, fg: Colors.success },
  warning: { bg: Colors.warningSoft, fg: Colors.warning },
  danger: { bg: Colors.errorSoft, fg: Colors.error },
};

export function Badge({ label, tone = 'neutral' }: { label: string; tone?: Tone }) {
  const t = TONES[tone];
  return (
    <View style={[styles.badge, { backgroundColor: t.bg }]}>
      <Text style={[styles.badgeText, { color: t.fg }]}>{label.charAt(0).toUpperCase() + label.slice(1)}</Text>
    </View>
  );
}

export function MenuRow({ icon, title, subtitle, count, countTone = 'neutral', onPress }: { icon: AppIconName; title: string; subtitle?: string; count?: number; countTone?: Tone; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.menuRow} onPress={onPress} activeOpacity={0.8} accessibilityRole="button">
      <View style={styles.menuIcon}>
        <AppIcon name={icon} size={18} color={Colors.text} />
      </View>
      <View style={styles.flex}>
        <Text style={styles.menuTitle}>{title}</Text>
        {subtitle ? <Text style={styles.menuSubtitle}>{subtitle}</Text> : null}
      </View>
      {count !== undefined ? <Badge label={String(count)} tone={countTone} /> : null}
      <AppIcon name="arrowRight" size={16} color={Colors.textMuted} />
    </TouchableOpacity>
  );
}

export function SearchField({ value, onChangeText, placeholder }: { value: string; onChangeText: (v: string) => void; placeholder: string }) {
  return (
    <View style={styles.search}>
      <AppIcon name="search" size={17} color={Colors.textMuted} />
      <TextInput
        style={styles.searchInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textMuted}
        autoCapitalize="none"
        autoCorrect={false}
      />
      {value ? (
        <TouchableOpacity onPress={() => onChangeText('')} hitSlop={8} accessibilityLabel="Clear search">
          <AppIcon name="close" size={15} color={Colors.textMuted} />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}

export function Segments<T extends string>({ options, value, onChange }: { options: { value: T; label: string; count?: number }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segments}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <TouchableOpacity key={o.value} style={[styles.segment, active && styles.segmentActive]} onPress={() => onChange(o.value)} activeOpacity={0.8} accessibilityRole="tab" accessibilityState={{ selected: active }}>
            <Text style={[styles.segmentText, active && styles.segmentTextActive]} numberOfLines={1}>
              {o.label}
              {o.count !== undefined ? ` ${o.count}` : ''}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export function RowCard({ children, onPress, style }: { children: React.ReactNode; onPress?: () => void; style?: StyleProp<ViewStyle> }) {
  return (
    <TouchableOpacity style={[styles.rowCard, style]} onPress={onPress} disabled={!onPress} activeOpacity={0.85}>
      {children}
    </TouchableOpacity>
  );
}

export function RowActions({ children }: { children: React.ReactNode }) {
  return <View style={styles.rowActions}>{children}</View>;
}

export function EmptyNote({ text }: { text: string }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyText}>{text}</Text>
    </View>
  );
}

interface PromptOptions {
  title: string;
  message?: string;
  placeholder?: string;
  confirmLabel: string;
  destructive?: boolean;
  /** When true the reason box is shown; otherwise this is a plain confirmation. */
  withReason?: boolean;
}

/**
 * Cross-platform confirm/reason dialog (Alert.prompt is iOS-only).
 * Returns the element to render and an `ask` function resolving to the reason, '' or null if cancelled.
 */
export function usePrompt(): [React.ReactNode, (options: PromptOptions) => Promise<string | null>] {
  const [options, setOptions] = useState<PromptOptions | null>(null);
  const [text, setText] = useState('');
  const resolver = useRef<((v: string | null) => void) | null>(null);

  const ask = useCallback((next: PromptOptions) => {
    setText('');
    setOptions(next);
    return new Promise<string | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = (value: string | null) => {
    resolver.current?.(value);
    resolver.current = null;
    setOptions(null);
  };

  const element = (
    <Modal visible={!!options} transparent animationType="fade" onRequestClose={() => close(null)}>
      <KeyboardAvoidingView style={styles.modalBackdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {options ? (
          <View style={styles.dialog}>
            <Text style={styles.dialogTitle}>{options.title}</Text>
            {options.message ? <Text style={styles.dialogMessage}>{options.message}</Text> : null}
            {options.withReason ? (
              <TextInput
                style={styles.dialogInput}
                value={text}
                onChangeText={setText}
                placeholder={options.placeholder ?? 'Reason (shared with the user where relevant)'}
                placeholderTextColor={Colors.textMuted}
                multiline
                autoFocus
              />
            ) : null}
            <View style={styles.dialogActions}>
              <Button title="Cancel" variant="outline" size="sm" onPress={() => close(null)} style={styles.flex} />
              <Button
                title={options.confirmLabel}
                variant={options.destructive ? 'dark' : 'primary'}
                size="sm"
                onPress={() => close(text.trim())}
                style={styles.flex}
              />
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );

  return [element, ask];
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  gate: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: Spacing.lg, backgroundColor: Colors.background },
  gateTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 19, marginTop: Spacing.md },
  gateText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 14, marginTop: 4 },

  stat: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  statValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 24, letterSpacing: -0.5 },
  statLabel: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 12.5, marginTop: 2 },
  statHint: { color: Colors.textMuted, fontFamily: Fonts.body, fontSize: 11.5, marginTop: 2 },

  sectionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: Spacing.lg, marginBottom: 10 },
  sectionLabel: { color: Colors.text, fontFamily: Fonts.display, fontSize: 16, letterSpacing: -0.2 },

  badge: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 3, alignSelf: 'flex-start' },
  badgeText: { fontFamily: Fonts.bodyBold, fontSize: 11 },

  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 8,
  },
  menuIcon: { width: 38, height: 38, borderRadius: 12, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  menuTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14.5 },
  menuSubtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 1 },

  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    height: 46,
  },
  searchInput: { flex: 1, color: Colors.text, fontFamily: Fonts.body, fontSize: 14.5, paddingVertical: 0 },

  segments: { flexDirection: 'row', padding: 3, borderRadius: 14, backgroundColor: '#E8EEF7', marginTop: 10 },
  segment: { flex: 1, height: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  segmentActive: { backgroundColor: Colors.ink },
  segmentText: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12 },
  segmentTextActive: { color: Colors.white },

  rowCard: {
    backgroundColor: Colors.surface,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  rowActions: { flexDirection: 'row', gap: 8, marginTop: 12 },

  empty: { padding: Spacing.lg, alignItems: 'center' },
  emptyText: { color: Colors.textMuted, fontFamily: Fonts.bodyMedium, fontSize: 13, textAlign: 'center' },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'center', padding: Spacing.lg },
  dialog: { backgroundColor: Colors.surface, borderRadius: 22, padding: Spacing.lg },
  dialogTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 18 },
  dialogMessage: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13.5, lineHeight: 19, marginTop: 6 },
  dialogInput: {
    minHeight: 84,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 14,
    padding: 12,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 14,
    textAlignVertical: 'top',
  },
  dialogActions: { flexDirection: 'row', gap: 10, marginTop: Spacing.lg },
});
