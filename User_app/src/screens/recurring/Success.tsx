// src/screens/recurring/Success.tsx
import React, { useEffect } from 'react';
import { StyleSheet, View, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withDelay } from 'react-native-reanimated';
import AppText from '../../components/ui/AppText';
import { useTheme } from '../../theme/useTheme';

export default function Success() {
  const { theme } = useTheme();
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const isEdit = route.params?.isEdit ?? false;

  const scale = useSharedValue(0.3);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withSpring(1, { damping: 10, stiffness: 80 });
    opacity.value = withDelay(200, withSpring(1));
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const animatedTextStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ translateY: withSpring(opacity.value ? 0 : 20) }],
    };
  });

  const primaryColor = theme.colors.primary || '#f97316';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <View style={styles.contentContainer}>
        {/* Animated Checked Bubble */}
        <Animated.View style={[
          styles.successBubble, 
          { backgroundColor: primaryColor + '1A', shadowColor: primaryColor },
          animatedIconStyle
        ]}>
          <View style={[styles.bubbleInner, { backgroundColor: primaryColor + '33' }]}>
            <Ionicons name="checkmark-done" size={64} color={primaryColor} />
          </View>
        </Animated.View>

        {/* Text Details */}
        <Animated.View style={[styles.textWrapper, animatedTextStyle]}>
          <AppText weight="bold" style={styles.title}>
            {isEdit ? 'Recurring Plan Updated' : 'Recurring Plan Created'}
          </AppText>
          <AppText style={styles.subtitle}>
            {isEdit 
              ? 'Your automated cleaning schedules have been updated successfully.'
              : 'Your home cleaning is now automated. Relax, we will take care of the rest!'}
          </AppText>
        </Animated.View>
      </View>

      {/* Action Buttons */}
      <View style={styles.bottomBar}>
        <PrimaryButton
          title="View Plans"
          onPress={() => {
            const fromServiceBooking = route.params?.fromServiceBooking ?? false;
            navigation.navigate('RecurringHome', { fromServiceBooking });
          }}
          iconName="list-outline"
          style={[styles.viewPlansBtn, { shadowColor: primaryColor }]}
        />
        
        <PrimaryButton
          title="Go Home"
          variant="secondary"
          onPress={() => {
            // Navigate back to MainScreen Home Tab
            navigation.navigate('HomeTab', { screen: 'Home' });
          }}
          iconName="home-outline"
          style={styles.goHomeBtn}
          textStyle={styles.goHomeText}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successBubble: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
    marginBottom: 32,
  },
  bubbleInner: {
    width: 110,
    height: 110,
    borderRadius: 55,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrapper: {
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 12,
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  bottomBar: {
    padding: 24,
    gap: 12,
  },
  viewPlansBtn: {
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
  },
  goHomeBtn: {
    backgroundColor: '#F3F4F6',
  },
  goHomeText: {
    color: '#4B5563',
  },
});
