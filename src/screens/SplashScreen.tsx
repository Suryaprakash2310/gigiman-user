import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../theme/useTheme';

const { height, width } = Dimensions.get('window');

export const SplashScreen = () => {
  const { setMode } = useTheme();
  const insets = useSafeAreaInsets();
  const logoScale = useRef(new Animated.Value(0.5)).current; // start smaller
  const textFade = useRef(new Animated.Value(0)).current; // text invisible initially
  const textTranslate = useRef(new Animated.Value(50)).current; // start 50px below
  const theme = useTheme().theme;

  useEffect(() => {
    setMode('light');

    // Animate logo scale and text simultaneously
    Animated.sequence([
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 5,
        tension: 60,
        useNativeDriver: true,

      }),
      Animated.parallel([
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
      ]),
    ]).start();
  }, []);

  // Dynamic logo size: 35% of screen width
  const logoSize = width * 0.85;

  return (
    <LinearGradient
      colors={[theme.colors.splashColor, theme.colors.splashColor]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={[styles.gradient, { paddingTop: insets.top }]}
    >
      <View style={styles.logoContainer}>
        <Animated.Image
          source={require('../../assets/images/gigiman-logo.png')}
          style={[
            styles.img,
            {
              width: logoSize,
              height: logoSize,
              transform: [{ scale: logoScale }],
            },
          ]}
        />
      </View>
      <Animated.Text
        style={[
          styles.title,
          { opacity: textFade, transform: [{ translateY: textTranslate }] },
        ]}
      >
        Gigiman
      </Animated.Text>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: height * 0.08,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  img: {
    resizeMode: 'contain',
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  title: {
    fontFamily: 'Poppins',
    color: '#fff',
    fontSize: height * 0.035,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
});
