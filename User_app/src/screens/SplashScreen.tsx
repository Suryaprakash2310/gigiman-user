import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

const { height, width } = Dimensions.get('window');

const TRACK_WIDTH = Math.min(width * 0.65, 260);
const BAR_WIDTH = TRACK_WIDTH * 0.45;

export const SplashScreen = () => {
  const { setMode } = useTheme();
  const insets = useSafeAreaInsets();

  const logoScale = useRef(new Animated.Value(0.7)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(0)).current;
  const textTranslate = useRef(new Animated.Value(15)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMode?.('light');

    // Entry Animations
    Animated.parallel([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(textFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslate, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Continuous Straight Left-to-Right Progress Bar Animation
    const progressLoop = Animated.loop(
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 1400,
        useNativeDriver: true,
      })
    );
    progressLoop.start();

    return () => progressLoop.stop();
  }, []);

  // Interpolate progress 0 -> 1 into translateX range for straight left-to-right movement
  const translateX = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-BAR_WIDTH, TRACK_WIDTH],
  });

  const logoSize = Math.min(width * 0.55, 220);

  return (
    <LinearGradient
      colors={['#F0FDFA', '#F8FAFC', '#FFFFFF']}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[
        styles.container,
        { paddingTop: insets.top, paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24 },
      ]}
    >
      {/* Center Main Content */}
      <View style={styles.centerContent}>
        {/* GIGIMAN LOGO */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              opacity: logoOpacity,
              transform: [{ scale: logoScale }],
            },
          ]}
        >
          <Image
            source={require('../../assets/images/gigiman-logo.png')}
            style={[styles.img, { width: logoSize, height: logoSize }]}
          />
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textFade, transform: [{ translateY: textTranslate }] },
          ]}
        >
          <Text style={styles.subtitle}>Book Trusted Home Services</Text>
        </Animated.View>

        {/* Straight Left-to-Right Loading Bar */}
        <View style={styles.loaderContainer}>
          <View style={[styles.track, { width: TRACK_WIDTH }]}>
            <Animated.View
              style={[
                styles.bar,
                {
                  width: BAR_WIDTH,
                  transform: [{ translateX }],
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Footer Text */}
      <Animated.View style={[styles.footer, { opacity: textFade }]}>
        <Text style={styles.footerText}>Powered by Gigiman</Text>
      </Animated.View>
    </LinearGradient>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  logoContainer: {
    marginBottom: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  img: {
    resizeMode: 'contain',
    borderRadius: 24,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 0,
  },
  subtitle: {
    color: '#04392D',
    fontSize: height * 0.02,
    fontWeight: '600',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  loaderContainer: {
    marginTop: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {
    height: 5,
    backgroundColor: '#E2E8F0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#04392D',
    borderRadius: 3,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  footerText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
    letterSpacing: 0.8,
  },
});
