import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import AppIcon, { AppIconName } from '../../components/AppIcon';
import Button from '../../components/Button';
import GycLoader from '../../components/GycLoader';
import Chip from '../../components/ui/Chip';
import ScreenHero from '../../components/ui/ScreenHero';
import TextField from '../../components/ui/TextField';
import { categoryStyle } from '../../constants/Categories';
import { MarketplaceProfileContent, ProfileIdentityHeader, ProfileSection, ProfileStrengthCard } from '../../components/MarketplaceProfileSections';
import { Colors } from '../../constants/Colors';
import { useTabBarSpace } from '../../constants/Layout';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { getPublicTrustProfile, subscribeToBookingsAsCustomer, subscribeToBookingsAsProvider, updateUserProfile, upsertProviderProfile } from '../../services/dataService';
import { signOut } from '../../services/authService';
import { uploadProfileImage } from '../../services/imageService';
import { AvailabilityStatus, PortfolioProject, ProfileService, ProviderProfile, SKILL_CATEGORIES, TrustSummary } from '../../types/models';

type Editor = 'details' | 'skills' | 'services' | 'portfolio' | 'availability' | 'privacy' | null;

const EMPTY_TRUST: TrustSummary = { trustScore: 50, responseBoost: 'standard', reviewAverage: 0, reviewCount: 0, completedJobs: 0, onTimePayments: 0, latePayments: 0, repeatClients: 0, referralCount: 0, reportCount: 0, blockCount: 0, estimatedRevenue: 0 };
const AVAILABILITY_OPTIONS: Array<{ value: AvailabilityStatus; label: string; description: string }> = [
  { value: 'availableNow', label: 'Available now', description: 'Customers can book same-day work.' },
  { value: 'availableToday', label: 'Available today', description: 'Taking work for today and upcoming days.' },
  { value: 'availableThisWeek', label: 'Available this week', description: 'Taking bookings later this week.' },
  { value: 'away', label: 'Away', description: 'Hide availability from customers for now.' },
];

function blankProvider(): Omit<ProviderProfile, 'uid' | 'updatedAt'> {
  return { skills: [], bio: '', available: false, availabilityStatus: 'away', services: [], portfolio: [] };
}

function toEditableProvider(provider?: ProviderProfile | null): Omit<ProviderProfile, 'uid' | 'updatedAt'> {
  if (!provider) return blankProvider();
  const { uid: _uid, updatedAt: _updatedAt, ...editable } = provider;
  return editable;
}

export default function ProfileScreen() {
  const { user, profile, refreshProfile } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const tabBarSpace = useTabBarSpace();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [trust, setTrust] = useState<TrustSummary>(EMPTY_TRUST);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editor, setEditor] = useState<Editor>(null);
  const [providerBookings, setProviderBookings] = useState(0);
  const [customerBookings, setCustomerBookings] = useState(0);
  const [displayName, setDisplayName] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [hourlyRate, setHourlyRate] = useState('');
  const [yearsExperience, setYearsExperience] = useState('');
  const [radius, setRadius] = useState('');
  const [languages, setLanguages] = useState('');
  const [serviceTitle, setServiceTitle] = useState('');
  const [serviceDescription, setServiceDescription] = useState('');
  const [servicePrice, setServicePrice] = useState('');
  const [portfolioTitle, setPortfolioTitle] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');
  const [portfolioSkills, setPortfolioSkills] = useState('');
  const scrollRef = useRef<ScrollView>(null);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const publicProfile = await getPublicTrustProfile(user.uid);
      if (publicProfile) {
        setProvider(publicProfile.provider ?? null);
        setTrust(publicProfile.trust);
        setReviews(publicProfile.reviews);
        setDisplayName(publicProfile.user.displayName);
        setLocation(publicProfile.provider?.location ?? publicProfile.user.location ?? '');
        setHeadline(publicProfile.provider?.headline ?? '');
        setBio(publicProfile.provider?.bio ?? '');
        setHourlyRate(publicProfile.provider?.hourlyRate?.toString() ?? '');
        setYearsExperience(publicProfile.provider?.yearsExperience?.toString() ?? '');
        setRadius(publicProfile.provider?.serviceRadiusKm?.toString() ?? '');
        setLanguages(publicProfile.provider?.languages?.join(', ') ?? '');
      }
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [user?.uid]);
  useEffect(() => {
    if (!user) return;
    const stopProvider = subscribeToBookingsAsProvider(user.uid, (bookings) => setProviderBookings(bookings.filter((item) => item.status === 'pending').length));
    const stopCustomer = subscribeToBookingsAsCustomer(user.uid, (bookings) => setCustomerBookings(bookings.filter((item) => item.status === 'pending' || item.status === 'accepted').length));
    return () => { stopProvider(); stopCustomer(); };
  }, [user?.uid]);

  const publicUser = useMemo(() => profile || { uid: user?.uid ?? '', displayName: displayName || user?.displayName || 'Your profile', email: user?.email ?? '', isProvider: !!provider, createdAt: Date.now() }, [profile, user, displayName, provider]);

  const persistProvider = async (patch: Partial<Omit<ProviderProfile, 'uid' | 'updatedAt'>>) => {
    if (!user) return;
    const next = { ...toEditableProvider(provider), ...patch };
    await upsertProviderProfile(user.uid, next);
    setProvider({ ...next, uid: user.uid, updatedAt: Date.now() });
  };

  const saveDetails = async () => {
    if (!user || !displayName.trim()) { Alert.alert('Add your name', 'A public name is required for your profile.'); return; }
    setSaving(true);
    try {
      await updateUserProfile(user.uid, { displayName: displayName.trim(), location: location.trim() || undefined });
      await persistProvider({ headline: headline.trim(), bio: bio.trim(), location: location.trim(), hourlyRate: hourlyRate ? Number(hourlyRate) : undefined, yearsExperience: yearsExperience ? Number(yearsExperience) : undefined, serviceRadiusKm: radius ? Number(radius) : undefined, languages: languages.split(',').map((item) => item.trim()).filter(Boolean) });
      await refreshProfile(); setEditor(null); await load();
    } catch (error: any) { Alert.alert('Could not save profile', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const toggleSkill = async (skill: string) => {
    const skills = provider?.skills ?? [];
    const nextSkills = skills.includes(skill) ? skills.filter((item) => item !== skill) : [...skills, skill];
    setSaving(true);
    try { await persistProvider({ skills: nextSkills }); } catch (error: any) { Alert.alert('Could not update skills', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const addService = async () => {
    if (!serviceTitle.trim()) { Alert.alert('Add a service name', 'Give customers a clear service they can book or request a quote for.'); return; }
    const item: ProfileService = { id: `service-${Date.now()}`, title: serviceTitle.trim(), description: serviceDescription.trim() || 'Details shared after booking.', pricingModel: servicePrice ? 'startingAt' : 'quote', ...(servicePrice ? { price: Number(servicePrice) } : {}), onSite: true };
    setSaving(true);
    try { await persistProvider({ services: [...(provider?.services ?? []), item], available: true, availabilityStatus: provider?.availabilityStatus ?? 'availableToday' }); setServiceTitle(''); setServiceDescription(''); setServicePrice(''); setEditor(null); } catch (error: any) { Alert.alert('Could not add service', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const addPortfolio = async () => {
    if (!portfolioTitle.trim()) { Alert.alert('Add a project title', 'Give your portfolio project a clear title.'); return; }
    const item: PortfolioProject = { id: `portfolio-${Date.now()}`, title: portfolioTitle.trim(), description: portfolioDescription.trim(), skills: portfolioSkills.split(',').map((skill) => skill.trim()).filter(Boolean), completedAt: Date.now() };
    setSaving(true);
    try { await persistProvider({ portfolio: [...(provider?.portfolio ?? []), item] }); setPortfolioTitle(''); setPortfolioDescription(''); setPortfolioSkills(''); setEditor(null); } catch (error: any) { Alert.alert('Could not add portfolio work', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const setAvailability = async (status: AvailabilityStatus) => {
    setSaving(true);
    try { await persistProvider({ availabilityStatus: status, available: status !== 'away' }); setEditor(null); } catch (error: any) { Alert.alert('Could not update availability', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const pickPhoto = async () => {
    if (!user) return;
    const result = await launchImageLibrary({ mediaType: 'photo', selectionLimit: 1, quality: 1 });
    const asset = result.assets?.[0];
    if (result.didCancel || !asset?.uri || !asset.width || !asset.height) return;
    setSaving(true);
    try { const photoURL = await uploadProfileImage(user.uid, { uri: asset.uri, width: asset.width, height: asset.height }); await updateUserProfile(user.uid, { photoURL }); await refreshProfile(); await load(); } catch (error: any) { Alert.alert('Could not update photo', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const removePhoto = async () => {
    if (!user) return;
    setSaving(true);
    try { await updateUserProfile(user.uid, { photoURL: '' }); await refreshProfile(); await load(); } catch (error: any) { Alert.alert('Could not remove photo', error.message ?? 'Please try again.'); } finally { setSaving(false); }
  };

  const handlePhoto = () => Alert.alert('Profile photo', 'Choose how you want to update your photo.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Remove', style: 'destructive', onPress: removePhoto }, { text: publicUser.photoURL ? 'Replace photo' : 'Upload photo', onPress: pickPhoto }]);
  const openEditor = (next: Editor) => { if (next === 'details') { setDisplayName(publicUser.displayName); setHeadline(provider?.headline ?? ''); setBio(provider?.bio ?? ''); setLocation(provider?.location ?? publicUser.location ?? ''); setHourlyRate(provider?.hourlyRate?.toString() ?? ''); setYearsExperience(provider?.yearsExperience?.toString() ?? ''); setRadius(provider?.serviceRadiusKm?.toString() ?? ''); setLanguages(provider?.languages?.join(', ') ?? ''); } setEditor(next); };
  const signOutNow = () => Alert.alert('Sign out', 'Are you sure you want to sign out?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Sign out', style: 'destructive', onPress: () => signOut() }]);

  if (loading) return <ProfileSkeleton topInset={insets.top} />;
  return (
    <View style={styles.screen}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={{ paddingBottom: tabBarSpace + Spacing.lg }}
        showsVerticalScrollIndicator={false}>
        <ScreenHero
          topInset={insets.top}
          eyebrow="Your space"
          title="Profile"
          subtitle="Your marketplace identity, services and hiring activity."
          height={150}
        />
        <View style={styles.body}>
          <ProfileIdentityHeader user={publicUser} provider={provider} trust={trust} isOwner onEditPhoto={handlePhoto} onEditProfile={() => openEditor('details')} />
          <ProfileStrengthCard provider={provider} photoURL={publicUser.photoURL} onEdit={() => openEditor('details')} />

          <ProfileSection title="My workspace">
            <View style={styles.workspaceGrid}>
              <WorkspaceTile icon="briefcase" color={Colors.accent} value={String(providerBookings)} label="job requests" onPress={() => navigation.navigate('BookingsTab')} />
              <WorkspaceTile icon="users" color={Colors.community} value={String(customerBookings)} label="active hires" onPress={() => navigation.navigate('BookingsTab')} />
              <WorkspaceTile
                icon="clock"
                color={provider?.available ? Colors.success : Colors.textMuted}
                value={provider?.available ? 'On' : 'Off'}
                label="availability"
                onPress={() => openEditor('availability')}
              />
              <WorkspaceTile icon="star" color="#F59E0B" value={String(trust.reviewCount)} label="reviews received" onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} />
            </View>
            <View style={styles.workspaceActions}>
              <Button title="Public profile" icon="user" variant="outline" size="sm" onPress={() => navigation.navigate('PublicProfile', { uid: user?.uid })} style={styles.flex} />
              <Button title="Privacy" icon="verified" variant="outline" size="sm" onPress={() => openEditor('privacy')} style={styles.flex} />
            </View>
          </ProfileSection>

          {!provider ? (
            <View style={styles.startCard}>
              <View style={styles.startIcon}>
                <AppIcon name="map" size={20} color={Colors.white} />
              </View>
              <Text style={styles.startTitle}>Ready to offer your services?</Text>
              <Text style={styles.startText}>
                Add your skills and a first service to appear on the Explore map. You can still hire people from the same account.
              </Text>
              <Button title="Set up my services" icon="arrowRight" onPress={() => openEditor('details')} style={styles.startButton} />
            </View>
          ) : null}

          <MarketplaceProfileContent user={publicUser} provider={provider} trust={trust} reviews={reviews} isOwner onEdit={(section) => openEditor(section)} />

          {profile?.isAdmin ? (
            <Button title="Moderation queue" icon="verified" variant="dark" onPress={() => navigation.navigate('Moderation')} style={styles.adminButton} />
          ) : null}
          <TouchableOpacity accessibilityRole="button" style={styles.signOut} onPress={signOutNow}>
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <ProfileEditor editor={editor} saving={saving} provider={provider} displayName={displayName} setDisplayName={setDisplayName} headline={headline} setHeadline={setHeadline} bio={bio} setBio={setBio} location={location} setLocation={setLocation} hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} yearsExperience={yearsExperience} setYearsExperience={setYearsExperience} radius={radius} setRadius={setRadius} languages={languages} setLanguages={setLanguages} serviceTitle={serviceTitle} setServiceTitle={setServiceTitle} serviceDescription={serviceDescription} setServiceDescription={setServiceDescription} servicePrice={servicePrice} setServicePrice={setServicePrice} portfolioTitle={portfolioTitle} setPortfolioTitle={setPortfolioTitle} portfolioDescription={portfolioDescription} setPortfolioDescription={setPortfolioDescription} portfolioSkills={portfolioSkills} setPortfolioSkills={setPortfolioSkills} onClose={() => setEditor(null)} onSaveDetails={saveDetails} onToggleSkill={toggleSkill} onAddService={addService} onAddPortfolio={addPortfolio} onSelectAvailability={setAvailability} onSavePrivacy={async (showPricing) => { await persistProvider({ privacy: { ...(provider?.privacy ?? {}), showPricing } }); setEditor(null); }} />
    </View>
  );
}

function WorkspaceTile({ icon, color, value, label, onPress }: { icon: AppIconName; color: string; value: string; label: string; onPress: () => void }) {
  return (
    <TouchableOpacity accessibilityRole="button" activeOpacity={0.8} style={styles.workspaceTile} onPress={onPress}>
      <View style={styles.workspaceIcon}>
        <AppIcon name={icon} size={16} color={Colors.text} />
      </View>
      <Text style={styles.workspaceValue}>{value}</Text>
      <Text style={styles.workspaceLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

interface EditorProps { editor: Editor; saving: boolean; provider: ProviderProfile | null; displayName: string; setDisplayName: (value: string) => void; headline: string; setHeadline: (value: string) => void; bio: string; setBio: (value: string) => void; location: string; setLocation: (value: string) => void; hourlyRate: string; setHourlyRate: (value: string) => void; yearsExperience: string; setYearsExperience: (value: string) => void; radius: string; setRadius: (value: string) => void; languages: string; setLanguages: (value: string) => void; serviceTitle: string; setServiceTitle: (value: string) => void; serviceDescription: string; setServiceDescription: (value: string) => void; servicePrice: string; setServicePrice: (value: string) => void; portfolioTitle: string; setPortfolioTitle: (value: string) => void; portfolioDescription: string; setPortfolioDescription: (value: string) => void; portfolioSkills: string; setPortfolioSkills: (value: string) => void; onClose: () => void; onSaveDetails: () => void; onToggleSkill: (skill: string) => void; onAddService: () => void; onAddPortfolio: () => void; onSelectAvailability: (value: AvailabilityStatus) => void; onSavePrivacy: (showPricing: boolean) => Promise<void>; }

const EDITOR_TITLES: Record<Exclude<Editor, null>, string> = {
  details: 'Edit profile',
  skills: 'Manage skills',
  services: 'Add a service',
  portfolio: 'Add portfolio work',
  availability: 'Set availability',
  privacy: 'Privacy settings',
};

function ProfileEditor(props: EditorProps) {
  const insets = useSafeAreaInsets();
  const [showPricing, setShowPricing] = useState(props.provider?.privacy?.showPricing ?? true);
  useEffect(() => setShowPricing(props.provider?.privacy?.showPricing ?? true), [props.editor, props.provider?.privacy?.showPricing]);
  if (!props.editor) return null;
  return (
    <Modal visible transparent animationType="slide" onRequestClose={props.onClose}>
      <View style={styles.modalBackdrop}>
        <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.sheetGrip} />
          <View style={styles.sheetHeader}>
            <View style={styles.flex}>
              <Text style={styles.sheetTitle}>{EDITOR_TITLES[props.editor]}</Text>
              <Text style={styles.sheetHint}>Changes are saved to your marketplace profile.</Text>
            </View>
            <TouchableOpacity accessibilityRole="button" accessibilityLabel="Close" onPress={props.onClose} style={styles.closeButton} hitSlop={8}>
              <AppIcon name="close" size={16} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            {props.editor === 'details' ? <DetailsForm {...props} /> : null}
            {props.editor === 'skills' ? <SkillsForm provider={props.provider} saving={props.saving} onToggle={props.onToggleSkill} /> : null}
            {props.editor === 'services' ? <ServiceForm {...props} /> : null}
            {props.editor === 'portfolio' ? <PortfolioForm {...props} /> : null}
            {props.editor === 'availability' ? <AvailabilityForm saving={props.saving} provider={props.provider} onSelect={props.onSelectAvailability} /> : null}
            {props.editor === 'privacy' ? <PrivacyForm showPricing={showPricing} setShowPricing={setShowPricing} saving={props.saving} onSave={() => props.onSavePrivacy(showPricing)} /> : null}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

function DetailsForm(props: EditorProps) {
  return (
    <>
      <Field label="Name" value={props.displayName} onChangeText={props.setDisplayName} placeholder="Your public name" />
      <Field label="Professional headline" value={props.headline} onChangeText={props.setHeadline} placeholder="Electrician · Smart home installer" />
      <Field label="About you" value={props.bio} onChangeText={props.setBio} placeholder="Describe your experience and the work you do." multiline />
      <Field label="Service location" value={props.location} onChangeText={props.setLocation} placeholder="Locality only, e.g. Laitumkhrah, Shillong" />
      <View style={styles.formRow}>
        <Field label="Hourly rate (₹)" value={props.hourlyRate} onChangeText={props.setHourlyRate} placeholder="Optional" keyboardType="numeric" compact />
        <Field label="Experience (years)" value={props.yearsExperience} onChangeText={props.setYearsExperience} placeholder="Optional" keyboardType="numeric" compact />
      </View>
      <View style={styles.formRow}>
        <Field label="Service radius (km)" value={props.radius} onChangeText={props.setRadius} placeholder="25" keyboardType="numeric" compact />
        <Field label="Languages" value={props.languages} onChangeText={props.setLanguages} placeholder="Khasi, English" compact />
      </View>
      <Button title="Save profile" onPress={props.onSaveDetails} loading={props.saving} style={styles.sheetButton} />
    </>
  );
}

function SkillsForm({ provider, saving, onToggle }: { provider: ProviderProfile | null; saving: boolean; onToggle: (skill: string) => void }) {
  return (
    <>
      <Text style={styles.formHint}>Your skills decide which jobs and hotspot zones you see on the Explore map.</Text>
      <View style={styles.skillPicker}>
        {SKILL_CATEGORIES.filter((skill) => skill !== 'Other').map((skill) => {
          const cat = categoryStyle(skill);
          return (
            <Chip
              key={skill}
              label={skill}
              icon={cat.icon}
             
              active={provider?.skills.includes(skill)}
              onPress={saving ? undefined : () => onToggle(skill)}
            />
          );
        })}
      </View>
    </>
  );
}

function ServiceForm(props: EditorProps) {
  return (
    <>
      <Field label="Service name" value={props.serviceTitle} onChangeText={props.setServiceTitle} placeholder="Home electrical inspection" />
      <Field label="What is included" value={props.serviceDescription} onChangeText={props.setServiceDescription} placeholder="Describe the outcome customers can expect." multiline />
      <Field label="Starting price (₹)" value={props.servicePrice} onChangeText={props.setServicePrice} placeholder="Leave blank for request quote" keyboardType="numeric" />
      <Button title="Add service" icon="plus" onPress={props.onAddService} loading={props.saving} style={styles.sheetButton} />
    </>
  );
}

function PortfolioForm(props: EditorProps) {
  return (
    <>
      <Field label="Project title" value={props.portfolioTitle} onChangeText={props.setPortfolioTitle} placeholder="Bamboo verandah restoration" />
      <Field label="Project description" value={props.portfolioDescription} onChangeText={props.setPortfolioDescription} placeholder="What did you deliver and what made it successful?" multiline />
      <Field label="Skills used" value={props.portfolioSkills} onChangeText={props.setPortfolioSkills} placeholder="Carpenter, Painter" />
      <Button title="Add portfolio work" icon="plus" onPress={props.onAddPortfolio} loading={props.saving} style={styles.sheetButton} />
    </>
  );
}

function AvailabilityForm({ provider, saving, onSelect }: { provider: ProviderProfile | null; saving: boolean; onSelect: (value: AvailabilityStatus) => void }) {
  const current = provider?.availabilityStatus ?? 'away';
  return (
    <View style={styles.availabilityPicker}>
      {AVAILABILITY_OPTIONS.map((option) => {
        const selected = current === option.value;
        const color = option.value === 'away' ? Colors.textMuted : option.value === 'availableThisWeek' ? Colors.warning : Colors.success;
        return (
          <TouchableOpacity
            key={option.value}
            disabled={saving}
            activeOpacity={0.8}
            style={[styles.availabilityOption, selected && styles.availabilityOptionActive]}
            onPress={() => onSelect(option.value)}>
            <View style={[styles.availabilityDot, { backgroundColor: color }]} />
            <View style={styles.flex}>
              <Text style={styles.availabilityOptionTitle}>{option.label}</Text>
              <Text style={styles.availabilityOptionDescription}>{option.description}</Text>
            </View>
            <View style={[styles.radio, selected && styles.radioActive]}>{selected ? <View style={styles.radioInner} /> : null}</View>
          </TouchableOpacity>
        );
      })}
      <Text style={styles.formHint}>While you are available, your approximate location shows as a pin on the Explore map.</Text>
    </View>
  );
}

function PrivacyForm({ showPricing, setShowPricing, saving, onSave }: { showPricing: boolean; setShowPricing: (value: boolean) => void; saving: boolean; onSave: () => void }) {
  return (
    <>
      <View style={styles.privacyRow}>
        <View style={styles.flex}>
          <Text style={styles.privacyTitle}>Show pricing publicly</Text>
          <Text style={styles.privacyText}>Customers can see your hourly and service pricing.</Text>
        </View>
        <Switch value={showPricing} onValueChange={setShowPricing} trackColor={{ false: Colors.borderStrong, true: Colors.accentSoft }} thumbColor={showPricing ? Colors.accent : Colors.surface} />
      </View>
      <Text style={styles.formHint}>
        Phone number, email and exact address stay private. On the map your location is rounded to about 100 m.
      </Text>
      <Button title="Save privacy" onPress={onSave} loading={saving} style={styles.sheetButton} />
    </>
  );
}

function Field({ label, compact, multiline, ...input }: { label: string; compact?: boolean; multiline?: boolean; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' }) {
  return <TextField label={label} multiline={multiline} containerStyle={[styles.field, compact && styles.fieldCompact]} style={multiline ? styles.fieldMultiline : null} {...input} />;
}

function ProfileSkeleton({ topInset }: { topInset: number }) {
  return (
    <View style={styles.screen}>
      <ScreenHero topInset={topInset} eyebrow="Your space" title="Profile" height={150} />
      <View style={styles.skeletonBody}>
        <GycLoader size={120} label="Loading your profile" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  flex: { flex: 1 },
  body: { paddingHorizontal: Spacing.md, marginTop: -Spacing.sm },
  workspaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  workspaceTile: {
    width: '48.4%',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
  },
  workspaceIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 10, backgroundColor: '#F1F5F9' },
  workspaceValue: { color: Colors.text, fontFamily: Fonts.display, fontSize: 20 },
  workspaceLabel: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11.5, marginTop: 2 },
  workspaceActions: { flexDirection: 'row', gap: 10, marginTop: 10 },
  startCard: { borderRadius: 24, padding: Spacing.lg - 4, marginTop: Spacing.lg, overflow: 'hidden', backgroundColor: Colors.ink },
  startIcon: { width: 40, height: 40, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.14)', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  startTitle: { color: Colors.white, fontFamily: Fonts.display, fontSize: 19 },
  startText: { color: 'rgba(255,255,255,0.76)', fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 6 },
  startButton: { marginTop: 16 },
  adminButton: { marginTop: Spacing.lg },
  signOut: { alignItems: 'center', paddingVertical: Spacing.lg, marginTop: Spacing.sm },
  signOutText: { color: Colors.error, fontFamily: Fonts.bodyBold, fontSize: 13.5 },

  modalBackdrop: { flex: 1, backgroundColor: 'rgba(15,23,42,0.45)', justifyContent: 'flex-end' },
  sheet: {
    maxHeight: '88%',
    backgroundColor: Colors.background,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  sheetGrip: { alignSelf: 'center', width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.borderStrong, marginTop: 16 },
  sheetHeader: { flexDirection: 'row', alignItems: 'flex-start', paddingTop: 12, paddingBottom: 12, marginBottom: 4 },
  sheetTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 21 },
  sheetHint: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 },
  closeButton: { width: 34, height: 34, borderRadius: 17, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center' },
  field: { marginTop: 12 },
  fieldCompact: { flex: 1, minWidth: 0 },
  fieldMultiline: { minHeight: 96 },
  formRow: { flexDirection: 'row', gap: 10 },
  formHint: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12.5, lineHeight: 18, marginTop: 10 },
  sheetButton: { marginTop: Spacing.lg },
  skillPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 12, paddingBottom: Spacing.md },
  availabilityPicker: { gap: 10, marginTop: 6 },
  availabilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
  },
  availabilityOptionActive: { borderColor: Colors.accent, backgroundColor: '#F5F9FF' },
  availabilityDot: { width: 10, height: 10, borderRadius: 5 },
  availabilityOptionTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  availabilityOptionDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: Colors.borderStrong, alignItems: 'center', justifyContent: 'center' },
  radioActive: { borderColor: Colors.accent },
  radioInner: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.accent },
  privacyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 18,
    padding: 14,
    marginTop: 8,
  },
  privacyTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 },
  privacyText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 },
  skeletonBody: { alignItems: 'center', paddingTop: Spacing.xl },
});
