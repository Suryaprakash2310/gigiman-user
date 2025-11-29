import React, { useEffect } from 'react';
import {
	SafeAreaView,
	View,
	StyleSheet,
	ScrollView,
	Pressable,
	Image,
} from 'react-native';
import AppCard from '../components/ui/AppCard';
import AppText from '../components/ui/AppText';
import AppInput from '../components/ui/AppInput';
import AppButton from '../components/ui/AppButton';
import { useTheme } from '../theme/useTheme';
import { MaterialIcons, Entypo, FontAwesome5 } from '@expo/vector-icons';

const services = [
	{ id: '1', name: 'Plumbing', icon: 'tint' },
	{ id: '2', name: 'Electrical', icon: 'bolt' },
	{ id: '3', name: 'Cleaning', icon: 'broom' },
	{ id: '4', name: 'Pest Control', icon: 'bug' },
	{ id: '5', name: 'AC Repair', icon: 'snowflake' },
	{ id: '6', name: 'Carpentry', icon: 'hammer' },
];

const recent = [
	{ id: 'r1', name: 'Water Pumbling', icon: 'water' },
	{ id: 'r2', name: 'House Cleaning', icon: 'broom' },
	{ id: 'r3', name: 'AC Service', icon: 'snowflake' },
];

export default function MainScreen() {
	const { theme, setMode } = useTheme();

	useEffect(() => {
		setMode && setMode('light');
	}, [setMode]);

	return (
		<SafeAreaView style={[styles.safe, { backgroundColor: theme.colors.background }]}>
			<ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
				<View style={styles.headerRow}>
					<View style={{ flex: 1 }}>
						<AppText weight="semibold" size="h3">Welcome Back</AppText>
						<AppText color="textMuted">Find services near you</AppText>
					</View>

					<View style={styles.locationBox}>
						<MaterialIcons name="place" size={18} color={theme.colors.primary} />
						<AppText weight="semibold" color="primary" style={{ marginLeft: 6 }}>Trichy, Tamil Nadu</AppText>
					</View>
				</View>

				<View style={{ marginTop: theme.spacing.md }}>
					<AppInput
						placeholder="Search services, e.g. Plumbing"
						style={{ borderRadius: 12 }}
					/>
				</View>

				<View style={{ marginTop: theme.spacing.md }}>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						<AppCard style={styles.offerCard}>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<Entypo name="ticket" size={28} color={theme.colors.surface} />
								<View style={{ marginLeft: 12 }}>
									<AppText weight="semibold" color="surface">First booking</AppText>
									<AppText color="surface">Get up to 30% off</AppText>
								</View>
							</View>
						</AppCard>

						<AppCard style={[styles.offerCard, { marginLeft: 12, backgroundColor: theme.colors.accent }] }>
							<View style={{ flexDirection: 'row', alignItems: 'center' }}>
								<FontAwesome5 name="gift" size={26} color={theme.colors.surface} />
								<View style={{ marginLeft: 12 }}>
									<AppText weight="semibold" color="surface">Holiday Offer</AppText>
									<AppText color="surface">Flat ₹50 off</AppText>
								</View>
							</View>
						</AppCard>
					</ScrollView>
				</View>

				<View style={{ marginTop: theme.spacing.lg }}>
					<AppText weight="semibold" size="h3" style={{ marginBottom: theme.spacing.sm }}>Recent Bookings</AppText>
					<ScrollView horizontal showsHorizontalScrollIndicator={false}>
						{recent.map(r => (
							<AppCard key={r.id} style={styles.recentCard}>
								<View style={styles.recentIconWrap}>
									<MaterialIcons name="home-repair-service" size={28} color={theme.colors.primary} />
								</View>
								<AppText weight="semibold" style={{ marginTop: 8 }}>{r.name}</AppText>
							</AppCard>
						))}
					</ScrollView>
				</View>

				<View style={{ marginTop: theme.spacing.lg }}>
					<AppText weight="semibold" size="h3" style={{ marginBottom: theme.spacing.sm }}>Services</AppText>

					<View style={[styles.grid, { position: 'relative' }]}> 
						{/** Show first N services and present a +N tile for the rest */}
						{(() => {
							const shownCount = 5;
							const shown = services.slice(0, shownCount);
							const hiddenCount = Math.max(0, services.length - shownCount);

							return (
								<>
									{shown.map(s => (
										<AppCard key={s.id} style={styles.serviceCard}>
											<View style={styles.iconWrap}>
												<FontAwesome5 name={s.icon as any} size={28} color={theme.colors.primary} />
											</View>
											<AppText weight="semibold" style={{ marginTop: 10 }}>{s.name}</AppText>
											<AppButton title="Book" onPress={() => {}} variant="secondary" style={{ marginTop: 12 }} />
										</AppCard>
									))}

									{hiddenCount > 0 && (
										<AppCard key="more" style={[styles.serviceCard, styles.moreTile]}>
											<Pressable onPress={() => { /* TODO: navigate to full list or open modal */ }} style={styles.moreInner}>
												<AppText weight="bold" size="h2">+{hiddenCount}</AppText>
												<AppText color="textMuted" style={{ marginTop: 6 }}>More</AppText>
											</Pressable>
										</AppCard>
									)}
								</>
							);
						})()}
					</View>
				</View>

			</ScrollView>
		</SafeAreaView>
	);
}

const styles = StyleSheet.create({
	safe: { flex: 1 },
	scroll: { padding: 20, paddingBottom: 40 },
	headerRow: { flexDirection: 'row', alignItems: 'center' },
	locationBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 10, backgroundColor: 'transparent' },
	offerCard: { width: 260, paddingVertical: 18, paddingHorizontal: 16, backgroundColor: '#FF6B6B' },
	recentCard: { width: 120, alignItems: 'center', paddingVertical: 18, marginRight: 12 },
	recentIconWrap: { width: 56, height: 56, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#FFF' },
	grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
	serviceCard: { width: '48%', marginBottom: 12, paddingVertical: 18, alignItems: 'center' },
	iconWrap: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
	threeDots: { position: 'absolute', left: 8, bottom: 8, padding: 6 },
	moreCard: { alignItems: 'center', justifyContent: 'center' },
	morePress: { width: 64, height: 64, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
	moreTile: { alignItems: 'center', justifyContent: 'center' },
	moreInner: { width: 92, height: 92, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
});

