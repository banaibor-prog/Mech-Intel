import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { useNavigation } from '@react-navigation/native';
import Button from '../../components/Button';
import { MarketplaceProfileContent, ProfileIdentityHeader, ProfileSection, ProfileStrengthCard } from '../../components/MarketplaceProfileSections';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { Fonts } from '../../constants/Typography';
import { useAuth } from '../../context/AuthContext';
import { getPublicTrustProfile, subscribeToBookingsAsCustomer, subscribeToBookingsAsProvider, updateUserProfile, upsertProviderProfile } from '../../services/dataService';
import { signOut } from '../../services/authService';
import { uploadProfileImage } from '../../services/imageService';
import { AvailabilityStatus, PortfolioProject, ProfileService, ProviderProfile, TrustSummary } from '../../types/models';

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

  if (loading) return <ProfileSkeleton />;
  return (
    <View style={styles.screen}>
      <ScrollView ref={scrollRef} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text><Text style={styles.screenSubtitle}>Your marketplace identity, services, and hiring activity.</Text>
        <ProfileIdentityHeader user={publicUser} provider={provider} trust={trust} isOwner onEditPhoto={handlePhoto} onEditProfile={() => openEditor('details')} />
        <ProfileStrengthCard provider={provider} photoURL={publicUser.photoURL} onEdit={() => openEditor('details')} />
        <ProfileSection title="My workspace"><View style={styles.workspaceGrid}><WorkspaceTile value={String(providerBookings)} label="job requests" onPress={() => navigation.navigate('BookingsTab')} /><WorkspaceTile value={String(customerBookings)} label="active hires" onPress={() => navigation.navigate('BookingsTab')} /><WorkspaceTile value={provider?.available ? 'On' : 'Off'} label="availability" onPress={() => openEditor('availability')} accent={provider?.available} /><WorkspaceTile value={String(trust.reviewCount)} label="reviews received" onPress={() => scrollRef.current?.scrollToEnd({ animated: true })} /></View><View style={styles.workspaceActions}><TouchableOpacity accessibilityRole="button" style={styles.workspaceAction} onPress={() => navigation.navigate('PublicProfile', { uid: user?.uid })}><Text style={styles.workspaceActionText}>Preview public profile</Text></TouchableOpacity><TouchableOpacity accessibilityRole="button" style={styles.workspaceAction} onPress={() => openEditor('privacy')}><Text style={styles.workspaceActionText}>Privacy settings</Text></TouchableOpacity></View></ProfileSection>
        {!provider ? <View style={styles.startCard}><Text style={styles.startTitle}>Ready to offer your services?</Text><Text style={styles.startText}>Add your skills and a first service. You can still hire people from the same account.</Text><Button title="Set up my services" onPress={() => openEditor('details')} style={styles.startButton} textStyle={styles.startButtonText} /></View> : null}
        <MarketplaceProfileContent user={publicUser} provider={provider} trust={trust} reviews={reviews} isOwner onEdit={(section) => openEditor(section)} />
        {profile?.isAdmin ? <TouchableOpacity accessibilityRole="button" style={styles.workspaceAction} onPress={() => navigation.navigate('Moderation')}><Text style={styles.workspaceActionText}>Moderation queue</Text></TouchableOpacity> : null}
        <TouchableOpacity accessibilityRole="button" style={styles.signOut} onPress={signOutNow}><Text style={styles.signOutText}>Sign out</Text></TouchableOpacity>
      </ScrollView>
      <ProfileEditor editor={editor} saving={saving} provider={provider} displayName={displayName} setDisplayName={setDisplayName} headline={headline} setHeadline={setHeadline} bio={bio} setBio={setBio} location={location} setLocation={setLocation} hourlyRate={hourlyRate} setHourlyRate={setHourlyRate} yearsExperience={yearsExperience} setYearsExperience={setYearsExperience} radius={radius} setRadius={setRadius} languages={languages} setLanguages={setLanguages} serviceTitle={serviceTitle} setServiceTitle={setServiceTitle} serviceDescription={serviceDescription} setServiceDescription={setServiceDescription} servicePrice={servicePrice} setServicePrice={setServicePrice} portfolioTitle={portfolioTitle} setPortfolioTitle={setPortfolioTitle} portfolioDescription={portfolioDescription} setPortfolioDescription={setPortfolioDescription} portfolioSkills={portfolioSkills} setPortfolioSkills={setPortfolioSkills} onClose={() => setEditor(null)} onSaveDetails={saveDetails} onToggleSkill={toggleSkill} onAddService={addService} onAddPortfolio={addPortfolio} onSelectAvailability={setAvailability} onSavePrivacy={async (showPricing) => { await persistProvider({ privacy: { ...(provider?.privacy ?? {}), showPricing } }); setEditor(null); }} />
    </View>
  );
}

function WorkspaceTile({ value, label, onPress, accent }: { value: string; label: string; onPress: () => void; accent?: boolean }) { return <TouchableOpacity accessibilityRole="button" style={styles.workspaceTile} onPress={onPress}><Text style={[styles.workspaceValue, accent && styles.workspaceValueAccent]}>{value}</Text><Text style={styles.workspaceLabel}>{label}</Text></TouchableOpacity>; }

interface EditorProps { editor: Editor; saving: boolean; provider: ProviderProfile | null; displayName: string; setDisplayName: (value: string) => void; headline: string; setHeadline: (value: string) => void; bio: string; setBio: (value: string) => void; location: string; setLocation: (value: string) => void; hourlyRate: string; setHourlyRate: (value: string) => void; yearsExperience: string; setYearsExperience: (value: string) => void; radius: string; setRadius: (value: string) => void; languages: string; setLanguages: (value: string) => void; serviceTitle: string; setServiceTitle: (value: string) => void; serviceDescription: string; setServiceDescription: (value: string) => void; servicePrice: string; setServicePrice: (value: string) => void; portfolioTitle: string; setPortfolioTitle: (value: string) => void; portfolioDescription: string; setPortfolioDescription: (value: string) => void; portfolioSkills: string; setPortfolioSkills: (value: string) => void; onClose: () => void; onSaveDetails: () => void; onToggleSkill: (skill: string) => void; onAddService: () => void; onAddPortfolio: () => void; onSelectAvailability: (value: AvailabilityStatus) => void; onSavePrivacy: (showPricing: boolean) => Promise<void>; }

function ProfileEditor(props: EditorProps) {
  const [showPricing, setShowPricing] = useState(props.provider?.privacy?.showPricing ?? true);
  useEffect(() => setShowPricing(props.provider?.privacy?.showPricing ?? true), [props.editor, props.provider?.privacy?.showPricing]);
  if (!props.editor) return null;
  const title = props.editor === 'details' ? 'Edit profile' : props.editor === 'skills' ? 'Manage skills' : props.editor === 'services' ? 'Add a service' : props.editor === 'portfolio' ? 'Add portfolio work' : props.editor === 'availability' ? 'Set availability' : 'Privacy settings';
  return <Modal visible transparent animationType="slide" onRequestClose={props.onClose}><View style={styles.modalBackdrop}><View style={styles.sheet}><View style={styles.sheetHeader}><View><Text style={styles.sheetTitle}>{title}</Text><Text style={styles.sheetHint}>Changes are saved to your marketplace profile.</Text></View><TouchableOpacity accessibilityRole="button" onPress={props.onClose} style={styles.closeButton}><Text style={styles.closeText}>Close</Text></TouchableOpacity></View><ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{props.editor === 'details' ? <DetailsForm {...props} /> : null}{props.editor === 'skills' ? <SkillsForm provider={props.provider} saving={props.saving} onToggle={props.onToggleSkill} /> : null}{props.editor === 'services' ? <ServiceForm {...props} /> : null}{props.editor === 'portfolio' ? <PortfolioForm {...props} /> : null}{props.editor === 'availability' ? <AvailabilityForm saving={props.saving} provider={props.provider} onSelect={props.onSelectAvailability} /> : null}{props.editor === 'privacy' ? <PrivacyForm showPricing={showPricing} setShowPricing={setShowPricing} saving={props.saving} onSave={() => props.onSavePrivacy(showPricing)} /> : null}</ScrollView></View></View></Modal>;
}

function DetailsForm(props: EditorProps) { return <><Field label="Name" value={props.displayName} onChangeText={props.setDisplayName} placeholder="Your public name" /><Field label="Professional headline" value={props.headline} onChangeText={props.setHeadline} placeholder="Electrician | Smart home installer" /><Field label="About you" value={props.bio} onChangeText={props.setBio} placeholder="Describe your experience and the work you do." multiline /><Field label="Service location" value={props.location} onChangeText={props.setLocation} placeholder="City or area only" /><View style={styles.formRow}><Field label="Hourly rate (Rs)" value={props.hourlyRate} onChangeText={props.setHourlyRate} placeholder="Optional" keyboardType="numeric" compact /><Field label="Experience (years)" value={props.yearsExperience} onChangeText={props.setYearsExperience} placeholder="Optional" keyboardType="numeric" compact /></View><View style={styles.formRow}><Field label="Service radius (km)" value={props.radius} onChangeText={props.setRadius} placeholder="25" keyboardType="numeric" compact /><Field label="Languages" value={props.languages} onChangeText={props.setLanguages} placeholder="English, Hindi" compact /></View><Button title={props.saving ? 'Saving...' : 'Save profile'} onPress={props.onSaveDetails} disabled={props.saving} style={styles.sheetButton} /></>; }
function SkillsForm({ provider, saving, onToggle }: { provider: ProviderProfile | null; saving: boolean; onToggle: (skill: string) => void }) { const skills = ['Electrician', 'Plumber', 'House Cleaner', 'Carpenter', 'Painter', 'Mechanic', 'Gardener', 'Cook', 'Photographer', 'Tutor', 'Freelance Designer', 'Freelance Developer']; return <View style={styles.skillPicker}>{skills.map((skill) => { const selected = provider?.skills.includes(skill); return <TouchableOpacity key={skill} disabled={saving} onPress={() => onToggle(skill)} style={[styles.skillOption, selected && styles.skillOptionActive]}><Text style={[styles.skillOptionText, selected && styles.skillOptionTextActive]}>{selected ? 'Selected  ' : ''}{skill}</Text></TouchableOpacity>; })}</View>; }
function ServiceForm(props: EditorProps) { return <><Field label="Service name" value={props.serviceTitle} onChangeText={props.setServiceTitle} placeholder="Home electrical inspection" /><Field label="What is included" value={props.serviceDescription} onChangeText={props.setServiceDescription} placeholder="Describe the outcome customers can expect." multiline /><Field label="Starting price (Rs)" value={props.servicePrice} onChangeText={props.setServicePrice} placeholder="Leave blank for request quote" keyboardType="numeric" /><Button title={props.saving ? 'Adding...' : 'Add service'} onPress={props.onAddService} disabled={props.saving} style={styles.sheetButton} /></>; }
function PortfolioForm(props: EditorProps) { return <><Field label="Project title" value={props.portfolioTitle} onChangeText={props.setPortfolioTitle} placeholder="Residential smart home installation" /><Field label="Project description" value={props.portfolioDescription} onChangeText={props.setPortfolioDescription} placeholder="What did you deliver and what made it successful?" multiline /><Field label="Skills used" value={props.portfolioSkills} onChangeText={props.setPortfolioSkills} placeholder="Electrical wiring, IoT" /><Button title={props.saving ? 'Adding...' : 'Add portfolio work'} onPress={props.onAddPortfolio} disabled={props.saving} style={styles.sheetButton} /></>; }
function AvailabilityForm({ provider, saving, onSelect }: { provider: ProviderProfile | null; saving: boolean; onSelect: (value: AvailabilityStatus) => void }) { const current = provider?.availabilityStatus ?? 'away'; return <View style={styles.availabilityPicker}>{AVAILABILITY_OPTIONS.map((option) => <TouchableOpacity key={option.value} disabled={saving} style={[styles.availabilityOption, current === option.value && styles.availabilityOptionActive]} onPress={() => onSelect(option.value)}><View><Text style={styles.availabilityOptionTitle}>{option.label}</Text><Text style={styles.availabilityOptionDescription}>{option.description}</Text></View><Text style={styles.choiceMark}>{current === option.value ? 'Selected' : ''}</Text></TouchableOpacity>)}</View>; }
function PrivacyForm({ showPricing, setShowPricing, saving, onSave }: { showPricing: boolean; setShowPricing: (value: boolean) => void; saving: boolean; onSave: () => void }) { return <><View style={styles.privacyRow}><View><Text style={styles.privacyTitle}>Show pricing publicly</Text><Text style={styles.privacyText}>Customers can see your hourly and service pricing.</Text></View><Switch value={showPricing} onValueChange={setShowPricing} trackColor={{ false: Colors.borderStrong, true: Colors.accentSoft }} thumbColor={showPricing ? Colors.accent : Colors.surface} /></View><Text style={styles.privacyNote}>Phone number, email, and exact address remain private by default.</Text><Button title={saving ? 'Saving...' : 'Save privacy'} onPress={onSave} disabled={saving} style={styles.sheetButton} /></>; }
function Field({ label, compact, multiline, ...input }: { label: string; compact?: boolean; multiline?: boolean; value: string; onChangeText: (value: string) => void; placeholder: string; keyboardType?: 'default' | 'numeric' }) { return <View style={[styles.field, compact && styles.fieldCompact]}><Text style={styles.fieldLabel}>{label}</Text><TextInput {...input} multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'} style={[styles.fieldInput, multiline && styles.fieldInputMultiline]} placeholderTextColor={Colors.textMuted} /></View>; }
function ProfileSkeleton() { return <View style={styles.skeletonScreen}><View style={styles.skeletonTitle} /><View style={styles.skeletonCard} /><View style={styles.skeletonCardSmall} /><View style={styles.skeletonCard} /></View>; }

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background }, container: { padding: Spacing.md, paddingTop: Spacing.xl, paddingBottom: Spacing.xxl + 90 }, screenTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 28 }, screenSubtitle: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 4, marginBottom: Spacing.md }, workspaceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, workspaceTile: { width: '48.6%', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 12, minHeight: 76 }, workspaceValue: { color: Colors.text, fontFamily: Fonts.displaySemibold, fontSize: 18 }, workspaceValueAccent: { color: Colors.success }, workspaceLabel: { color: Colors.textLight, fontFamily: Fonts.bodyMedium, fontSize: 11, marginTop: 4 }, workspaceActions: { flexDirection: 'row', gap: 8, marginTop: 8 }, workspaceAction: { flex: 1, minHeight: 42, borderRadius: 10, backgroundColor: Colors.surfaceAlt, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8 }, workspaceActionText: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 12, textAlign: 'center' }, startCard: { backgroundColor: Colors.ink, borderRadius: 16, padding: Spacing.md, marginTop: Spacing.lg }, startTitle: { color: Colors.white, fontFamily: Fonts.displaySemibold, fontSize: 18 }, startText: { color: 'rgba(255,255,255,0.72)', fontFamily: Fonts.body, fontSize: 13, lineHeight: 19, marginTop: 6 }, startButton: { backgroundColor: Colors.white, marginTop: 14 }, startButtonText: { color: Colors.ink }, signOut: { alignItems: 'center', paddingVertical: Spacing.lg, marginTop: Spacing.xl }, signOutText: { color: Colors.error, fontFamily: Fonts.bodyBold, fontSize: 13 }, modalBackdrop: { flex: 1, backgroundColor: 'rgba(10,10,16,0.42)', justifyContent: 'flex-end' }, sheet: { maxHeight: '88%', backgroundColor: Colors.background, borderTopLeftRadius: 22, borderTopRightRadius: 22, padding: Spacing.md, paddingBottom: Spacing.xl }, sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', borderBottomWidth: 1, borderColor: Colors.border, paddingBottom: 12, marginBottom: 8 }, sheetTitle: { color: Colors.text, fontFamily: Fonts.display, fontSize: 20 }, sheetHint: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 }, closeButton: { paddingHorizontal: 8, paddingVertical: 6 }, closeText: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12 }, field: { marginTop: 12 }, fieldCompact: { flex: 1, minWidth: 0 }, fieldLabel: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12, marginBottom: 6 }, fieldInput: { minHeight: 46, backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 11, color: Colors.text, paddingHorizontal: 12, fontFamily: Fonts.body, fontSize: 14 }, fieldInputMultiline: { minHeight: 92, paddingTop: 12 }, formRow: { flexDirection: 'row', gap: 10 }, sheetButton: { marginTop: Spacing.lg }, skillPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 8 }, skillOption: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 11 }, skillOptionActive: { backgroundColor: Colors.accentSoft, borderColor: Colors.accent }, skillOptionText: { color: Colors.textLight, fontFamily: Fonts.bodySemibold, fontSize: 12 }, skillOptionTextActive: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 12 }, availabilityPicker: { gap: 8, marginTop: 6 }, availabilityOption: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }, availabilityOptionActive: { borderColor: Colors.accent, backgroundColor: Colors.accentSoft }, availabilityOptionTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 }, availabilityOptionDescription: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3 }, choiceMark: { color: Colors.accent, fontFamily: Fonts.bodyBold, fontSize: 11 }, privacyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 12, padding: 13, marginTop: 8 }, privacyTitle: { color: Colors.text, fontFamily: Fonts.bodyBold, fontSize: 14 }, privacyText: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, marginTop: 3, maxWidth: 235 }, privacyNote: { color: Colors.textLight, fontFamily: Fonts.body, fontSize: 12, lineHeight: 18, marginTop: 12 }, skeletonScreen: { flex: 1, backgroundColor: Colors.background, padding: Spacing.md, paddingTop: Spacing.xl }, skeletonTitle: { width: 110, height: 28, borderRadius: 8, backgroundColor: Colors.surfaceAlt }, skeletonCard: { height: 182, borderRadius: 16, backgroundColor: Colors.surfaceAlt, marginTop: Spacing.md }, skeletonCardSmall: { height: 112, borderRadius: 16, backgroundColor: Colors.surfaceAlt, marginTop: Spacing.md },
});
