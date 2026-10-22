import React, { useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import AppText from '../ui/AppText';

interface ServiceTimerCardProps {
  timerData: {
    isTimeBased?: boolean;
    timerStatus?: string;
    remainingSeconds?: number;
    extraRemainingSeconds?: number;
    overtimeSeconds?: number;
    totalDurationMinutes?: number;
    startTime?: string | number;
  } | null;
  serviceName?: string;
  isOtpVerified?: boolean;
  onPressExtra?: () => void;
}

const DIAL_SIZE = 136;
const STROKE_WIDTH = 9;
const RADIUS = (DIAL_SIZE - STROKE_WIDTH) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function ServiceTimerCard({
  timerData,
  serviceName = 'Job Service',
  isOtpVerified = false,
}: ServiceTimerCardProps) {
  // Pulsing animation for the status dot
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.4,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.9,
            duration: 900,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 900,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.4,
            duration: 900,
            easing: Easing.in(Easing.ease),
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, glowAnim]);

  const status = timerData?.timerStatus || 'RUNNING';
  const totalMins = timerData?.totalDurationMinutes || 60;
  const totalSecs = totalMins * 60;

  // Calculate progress ratio (0 to 1)
  const progressRatio = useMemo(() => {
    if (status === 'RUNNING') {
      const remaining = timerData?.remainingSeconds ?? totalSecs;
      const elapsed = Math.max(0, totalSecs - remaining);
      return Math.min(1, Math.max(0, elapsed / totalSecs));
    }
    if (status === 'EXTRA_TIME_RUNNING') {
      const extraRemaining = timerData?.extraRemainingSeconds ?? 600;
      const elapsedExtra = Math.max(0, 600 - extraRemaining);
      return Math.min(1, Math.max(0, elapsedExtra / 600));
    }
    return 1; // Overtime full dial
  }, [status, timerData?.remainingSeconds, timerData?.extraRemainingSeconds, totalSecs]);

  const strokeDashoffset = CIRCUMFERENCE * (1 - progressRatio);

  // Format digital countdown string
  const formattedDigits = useMemo(() => {
    let secs = 0;
    let prefix = '';

    if (status === 'RUNNING') {
      secs = Math.max(0, timerData?.remainingSeconds ?? totalSecs);
    } else if (status === 'EXTRA_TIME_RUNNING') {
      secs = Math.max(0, timerData?.extraRemainingSeconds ?? 600);
    } else {
      secs = Math.max(0, timerData?.overtimeSeconds ?? 0);
      prefix = '+';
    }

    const mins = Math.floor(secs / 60);
    const remSecs = secs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hrs > 0) {
      return `${prefix}${hrs}:${remMins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
    }
    return `${prefix}${remMins.toString().padStart(2, '0')}:${remSecs.toString().padStart(2, '0')}`;
  }, [status, timerData?.remainingSeconds, timerData?.extraRemainingSeconds, timerData?.overtimeSeconds, totalSecs]);

  // Elapsed time string
  const elapsedTimeStr = useMemo(() => {
    let elapsedSecs = 0;
    if (status === 'RUNNING') {
      const remaining = Math.max(0, timerData?.remainingSeconds ?? totalSecs);
      elapsedSecs = Math.max(0, totalSecs - remaining);
    } else if (status === 'EXTRA_TIME_RUNNING') {
      const extraRem = Math.max(0, timerData?.extraRemainingSeconds ?? 600);
      elapsedSecs = totalSecs + Math.max(0, 600 - extraRem);
    } else {
      elapsedSecs = totalSecs + 600 + Math.max(0, timerData?.overtimeSeconds ?? 0);
    }

    const mins = Math.floor(elapsedSecs / 60);
    const remSecs = elapsedSecs % 60;
    const hrs = Math.floor(mins / 60);
    const remMins = mins % 60;
    if (hrs > 0) {
      return `${hrs}h ${remMins}m ${remSecs}s`;
    }
    return `${remMins}m ${remSecs}s`;
  }, [status, timerData, totalSecs]);

  // Theme styling based on active timer state
  const themeConfig = useMemo(() => {
    switch (status) {
      case 'EXTRA_TIME_RUNNING':
        return {
          gradient: ['#1C1405', '#2E1E08', '#1A1204'] as const,
          borderColor: 'rgba(245, 158, 11, 0.45)',
          glowColor: '#F59E0B',
          badgeBg: 'rgba(245, 158, 11, 0.18)',
          badgeBorder: 'rgba(245, 158, 11, 0.4)',
          badgeText: '#FBBF24',
          dotColor: '#F59E0B',
          statusTitle: '10-MIN GRACE PERIOD',
          strokeColors: ['#F59E0B', '#FBBF24'],
          dialSubtext: 'BUFFER LEFT',
          description: 'Initial booking completed. 10-minute grace period active.',
          iconName: 'hourglass' as const,
          iconColor: '#F59E0B',
        };
      case 'OVERTIME_RUNNING':
        return {
          gradient: ['#190C28', '#2D1445', '#160924'] as const,
          borderColor: 'rgba(168, 85, 247, 0.45)',
          glowColor: '#A855F7',
          badgeBg: 'rgba(168, 85, 247, 0.18)',
          badgeBorder: 'rgba(168, 85, 247, 0.4)',
          badgeText: '#C084FC',
          dotColor: '#A855F7',
          statusTitle: 'EXTENDED OVERTIME',
          strokeColors: ['#A855F7', '#EC4899'],
          dialSubtext: 'OVERTIME',
          description: 'Service is currently ongoing in extended overtime mode.',
          iconName: 'flash' as const,
          iconColor: '#C084FC',
        };
      case 'RUNNING':
      default:
        return {
          gradient: ['#061E17', '#0A3125', '#051812'] as const,
          borderColor: 'rgba(16, 185, 129, 0.45)',
          glowColor: '#10B981',
          badgeBg: 'rgba(16, 185, 129, 0.18)',
          badgeBorder: 'rgba(16, 185, 129, 0.4)',
          badgeText: '#34D399',
          dotColor: '#10B981',
          statusTitle: isOtpVerified ? 'OTP VERIFIED • SERVICE ACTIVE' : 'SERVICE IN PROGRESS',
          strokeColors: ['#10B981', '#06B6D4'],
          dialSubtext: `${Math.round(progressRatio * 100)}% COMPLETED`,
          description: 'Technician is actively performing your service.',
          iconName: 'time' as const,
          iconColor: '#34D399',
        };
    }
  }, [status, progressRatio, isOtpVerified]);

  return (
    <View style={styles.outerWrapper}>
      <LinearGradient
        colors={themeConfig.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.cardContainer, { borderColor: themeConfig.borderColor }]}
      >
        {/* TOP STATUS HEADER */}
        <View style={styles.topHeader}>
          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: themeConfig.badgeBg,
                borderColor: themeConfig.badgeBorder,
              },
            ]}
          >
            <View style={styles.dotContainer}>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    backgroundColor: themeConfig.dotColor,
                    transform: [{ scale: pulseAnim }],
                    opacity: glowAnim,
                  },
                ]}
              />
              <View
                style={[styles.solidDot, { backgroundColor: themeConfig.dotColor }]}
              />
            </View>
            <AppText
              weight="bold"
              style={[styles.statusBadgeText, { color: themeConfig.badgeText }]}
            >
              {themeConfig.statusTitle}
            </AppText>
          </View>

          {/* Service Duration Tag */}
          <View style={styles.durationTag}>
            <Ionicons name="radio" size={12} color="#10B981" style={{ marginRight: 4 }} />
            <AppText weight="medium" style={styles.durationTagText}>
              LIVE SYNC
            </AppText>
          </View>
        </View>

        {/* HERO CIRCULAR DIAL SECTION */}
        <View style={styles.heroSection}>
          <View style={styles.dialContainer}>
            <Svg width={DIAL_SIZE} height={DIAL_SIZE} style={styles.svgDial}>
              <Defs>
                <SvgGradient id="timerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <Stop offset="0%" stopColor={themeConfig.strokeColors[0]} />
                  <Stop offset="100%" stopColor={themeConfig.strokeColors[1]} />
                </SvgGradient>
              </Defs>

              {/* Background Track */}
              <Circle
                cx={DIAL_SIZE / 2}
                cy={DIAL_SIZE / 2}
                r={RADIUS}
                stroke="rgba(255, 255, 255, 0.12)"
                strokeWidth={STROKE_WIDTH}
                fill="none"
              />

              {/* Progress Stroke */}
              <Circle
                cx={DIAL_SIZE / 2}
                cy={DIAL_SIZE / 2}
                r={RADIUS}
                stroke="url(#timerGrad)"
                strokeWidth={STROKE_WIDTH}
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="none"
                transform={`rotate(-90 ${DIAL_SIZE / 2} ${DIAL_SIZE / 2})`}
              />
            </Svg>

            {/* Center Content */}
            <View style={styles.dialCenterContent}>
              <Ionicons
                name={themeConfig.iconName}
                size={18}
                color={themeConfig.iconColor}
                style={{ marginBottom: 2 }}
              />
              <Text style={styles.timerDigitsText} numberOfLines={1} adjustsFontSizeToFit>
                {formattedDigits}
              </Text>
              <Text style={[styles.dialSubLabel, { color: themeConfig.badgeText }]}>
                {themeConfig.dialSubtext}
              </Text>
            </View>
          </View>
        </View>

        {/* METRICS ROW (DURATION / ELAPSED / SERVICE) */}
        <View style={styles.metricsContainer}>
          <View style={styles.metricItem}>
            <AppText weight="regular" style={styles.metricLabel}>
              Booked Time
            </AppText>
            <AppText weight="bold" style={styles.metricValue}>
              {totalMins} mins
            </AppText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <AppText weight="regular" style={styles.metricLabel}>
              Time Elapsed
            </AppText>
            <AppText weight="bold" style={styles.metricValue}>
              {elapsedTimeStr}
            </AppText>
          </View>

          <View style={styles.metricDivider} />

          <View style={styles.metricItem}>
            <AppText weight="regular" style={styles.metricLabel}>
              Service
            </AppText>
            <AppText weight="bold" numberOfLines={1} style={styles.metricValue}>
              {serviceName}
            </AppText>
          </View>
        </View>

        {/* BOTTOM REAL-TIME SYNC NOTICE */}
        <View style={styles.bottomNoticeRow}>
          <Ionicons
            name="shield-checkmark"
            size={14}
            color="rgba(255, 255, 255, 0.6)"
            style={{ marginRight: 6 }}
          />
          <AppText weight="regular" style={styles.bottomNoticeText} numberOfLines={2}>
            {themeConfig.description}
          </AppText>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerWrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    borderRadius: 22,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 10,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  cardContainer: {
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  dotContainer: {
    width: 14,
    height: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  solidDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusBadgeText: {
    fontSize: 11,
    letterSpacing: 0.6,
  },
  durationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  durationTagText: {
    color: '#D1FAE5',
    fontSize: 10,
    letterSpacing: 0.5,
  },
  heroSection: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 4,
  },
  dialContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  svgDial: {
    position: 'absolute',
  },
  dialCenterContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  timerDigitsText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: 1.2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    marginTop: 2,
    maxWidth: DIAL_SIZE - 24,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  dialSubLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  metricsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginTop: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  metricItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricDivider: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  metricLabel: {
    color: 'rgba(255, 255, 255, 0.55)',
    fontSize: 10,
    marginBottom: 2,
  },
  metricValue: {
    color: '#FFFFFF',
    fontSize: 12,
  },
  bottomNoticeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 4,
  },
  bottomNoticeText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 11,
    lineHeight: 15,
    flex: 1,
  },
});
