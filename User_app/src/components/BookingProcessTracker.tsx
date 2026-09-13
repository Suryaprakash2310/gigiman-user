import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { BookingItem } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  FadeIn,
  FadeInDown,
} from "react-native-reanimated";

interface Props {
  booking: BookingItem;
  compact?: boolean;
}

export type StepState = "completed" | "in_progress" | "pending";

export interface ProcessStep {
  id: number;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  state: StepState;
}

export function getBookingProcessSteps(booking: BookingItem, compact: boolean = false): ProcessStep[] {
  const status = booking.status;
  const isFailedOrManual =
    booking.assignmentStatus === "FAILED" || status === "manual_assign";
  const isManuallyAssigned = booking.isManuallyAssigned || false;

  const steps: ProcessStep[] = [];

  // COMPACT MODE: 5 milestones for list cards (Assigned -> Start Trip -> Arrival -> Service -> Complete)
  if (compact) {
    // 1. Assigned / Search
    let step1: StepState = "pending";
    if (
      [
        "accepted",
        "assigned",
        "provider_started_trip",
        "provider_on_the_way",
        "provider_arrived",
        "otp",
        "otp_verified",
        "in_progress",
        "completed",
      ].includes(status) ||
      isManuallyAssigned
    ) {
      step1 = "completed";
    } else if (status === "searching" || isFailedOrManual) {
      step1 = "in_progress";
    }

    steps.push({
      id: 1,
      iconName: isFailedOrManual ? "alert-circle-outline" : "person-outline",
      title: isFailedOrManual ? "Manual Assign" : "Assigned",
      subtitle: isFailedOrManual ? "Pending" : "Technician",
      state: step1,
    });

    // 2. Start Trip / En Route
    let step2: StepState = "pending";
    if (
      [
        "provider_arrived",
        "otp",
        "otp_verified",
        "in_progress",
        "completed",
      ].includes(status)
    ) {
      step2 = "completed";
    } else if (
      ["provider_started_trip", "provider_on_the_way"].includes(status)
    ) {
      step2 = "in_progress";
    }

    steps.push({
      id: 2,
      iconName: "navigate-outline",
      title: "Start Trip",
      subtitle: status === "provider_started_trip" ? "Started" : "On Way",
      state: step2,
    });

    // 3. Arrival
    let step3: StepState = "pending";
    if (
      ["otp", "otp_verified", "in_progress", "completed"].includes(status)
    ) {
      step3 = "completed";
    } else if (status === "provider_arrived") {
      step3 = "in_progress";
    }

    steps.push({
      id: 3,
      iconName: "location-outline",
      title: "Arrival",
      subtitle: "Reached",
      state: step3,
    });

    // 4. Service / In Progress
    let step4: StepState = "pending";
    if (status === "completed") {
      step4 = "completed";
    } else if (
      ["otp", "otp_verified", "in_progress"].includes(status)
    ) {
      step4 = "in_progress";
    }

    steps.push({
      id: 4,
      iconName: "construct-outline",
      title: "Service",
      subtitle: status === "in_progress" ? "In Progress" : "Starting",
      state: step4,
    });

    // 5. Complete
    steps.push({
      id: 5,
      iconName: "checkmark-done-outline",
      title: "Complete",
      subtitle: "Done",
      state: status === "completed" ? "completed" : "pending",
    });

    return steps;
  }

  // FULL MODE (Timeline in Booking Details)
  // Step 1: Auto-Searching
  let step1State: StepState = "pending";
  if (
    [
      "accepted",
      "assigned",
      "provider_started_trip",
      "provider_on_the_way",
      "provider_arrived",
      "otp",
      "otp_verified",
      "in_progress",
      "completed",
    ].includes(status) ||
    isFailedOrManual ||
    isManuallyAssigned
  ) {
    step1State = "completed";
  } else if (["searching", "scheduled"].includes(status)) {
    step1State = "in_progress";
  }

  steps.push({
    id: 1,
    iconName: "search-outline",
    title: "Searching Technician",
    subtitle: step1State === "completed" ? "Technician found" : "Searching nearby technicians...",
    state: step1State,
  });

  // Step 2: Awaiting Manual Assignment (Only if failed or manually assigned)
  if (isFailedOrManual || isManuallyAssigned) {
    let manualStepState: StepState = "pending";
    if (
      [
        "accepted",
        "assigned",
        "provider_started_trip",
        "provider_on_the_way",
        "provider_arrived",
        "otp",
        "otp_verified",
        "in_progress",
        "completed",
      ].includes(status) &&
      isManuallyAssigned
    ) {
      manualStepState = "completed";
    } else if (isFailedOrManual && !isManuallyAssigned) {
      manualStepState = "in_progress";
    }

    steps.push({
      id: steps.length + 1,
      iconName: "time-outline",
      title: "Awaiting Manual Assignment",
      subtitle: manualStepState === "completed" ? "Assigned by admin" : "Awaiting manual assignment...",
      state: manualStepState,
    });
  }

  // Step 2 / 3: Technician Assigned
  let assignedState: StepState = "pending";
  if (
    [
      "provider_started_trip",
      "provider_on_the_way",
      "provider_arrived",
      "otp",
      "otp_verified",
      "in_progress",
      "completed",
    ].includes(status)
  ) {
    assignedState = "completed";
  } else if (["accepted", "assigned"].includes(status)) {
    assignedState = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "person-outline",
    title: "Technician Assigned",
    subtitle:
      assignedState === "completed" || assignedState === "in_progress"
        ? booking.name
          ? `Assigned to ${booking.name}`
          : "Service provider accepted"
        : "Waiting for technician assignment",
    state: assignedState,
  });

  // Step 3 / 4: Technical Start Trip & On The Way
  let startTripState: StepState = "pending";
  if (["provider_arrived", "otp", "otp_verified", "in_progress", "completed"].includes(status)) {
    startTripState = "completed";
  } else if (["provider_started_trip", "provider_on_the_way"].includes(status)) {
    startTripState = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "navigate-outline",
    title: "Technician Start Trip",
    subtitle:
      startTripState === "completed"
        ? "Technician started trip & reached location"
        : startTripState === "in_progress"
        ? booking.eta
          ? `En route • Arriving in ~${booking.eta}`
          : "Technician started trip towards address"
        : "Pending technician trip start",
    state: startTripState,
  });

  // Step 4 / 5: Technician Arrival
  let arrivalState: StepState = "pending";
  if (["otp", "otp_verified", "in_progress", "completed"].includes(status)) {
    arrivalState = "completed";
  } else if (status === "provider_arrived") {
    arrivalState = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "location-outline",
    title: "Technician Arrival",
    subtitle:
      arrivalState === "completed"
        ? "Technician reached customer address"
        : arrivalState === "in_progress"
        ? "Technician has arrived at location"
        : "Pending technician arrival",
    state: arrivalState,
  });

  // Step 5 / 6: Service OTP & In Progress
  let serviceState: StepState = "pending";
  if (status === "completed") {
    serviceState = "completed";
  } else if (["otp", "otp_verified", "in_progress"].includes(status)) {
    serviceState = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "construct-outline",
    title: "Service In Progress",
    subtitle:
      serviceState === "completed"
        ? "Service completed by technician"
        : status === "in_progress"
        ? "Service currently in progress"
        : booking.otp
        ? `Share OTP: ${booking.otp} to start service`
        : "Pending OTP verification & start",
    state: serviceState,
  });

  // Step 6 / 7: Service Completed
  let completeState: StepState = "pending";
  if (status === "completed") {
    completeState = "completed";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "checkmark-done-outline",
    title: "Service Completed",
    subtitle:
      completeState === "completed"
        ? "Service completed successfully"
        : "Pending technician service completion",
    state: completeState,
  });

  return steps;
}

function AnimatedTimelineStepItem({
  step,
  index,
  isLast,
  nextStepState,
  styles,
}: {
  step: ProcessStep;
  index: number;
  isLast: boolean;
  nextStepState?: StepState;
  styles: any;
}) {
  const isCompleted = step.state === "completed";
  const isInProgress = step.state === "in_progress";

  const pulseScale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);

  useEffect(() => {
    if (isInProgress) {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.08, { duration: 800 }),
          withTiming(1, { duration: 800 })
        ),
        -1,
        true
      );
      glowOpacity.value = withRepeat(
        withSequence(
          withTiming(0.6, { duration: 800 }),
          withTiming(0.1, { duration: 800 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = withSpring(1);
      glowOpacity.value = withTiming(0);
    }
  }, [isInProgress]);

  const animatedCircleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const animatedGlowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  let badgeBg = "#F8FAFC";
  let badgeBorderColor = "#E2E8F0";
  let iconColor = "#94A3B8";

  if (isCompleted) {
    badgeBg = "#ECFDF5";
    badgeBorderColor = "#34D399";
    iconColor = "#059669";
  } else if (isInProgress) {
    badgeBg = "#F0FDFA";
    badgeBorderColor = "#0D9488";
    iconColor = "#0D9488";
  }

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(350)}
      style={styles.stepWrapper}
    >
      {/* Left Column: Icon & Connector Line */}
      <View style={styles.leftCol}>
        <View style={{ alignItems: "center", justifyContent: "center" }}>
          {isInProgress && (
            <Animated.View
              style={[
                styles.glowRing,
                animatedGlowStyle,
                { borderColor: "#0D9488" },
              ]}
            />
          )}
          <Animated.View
            style={[
              styles.iconCircle,
              {
                backgroundColor: badgeBg,
                borderColor: badgeBorderColor,
              },
              animatedCircleStyle,
            ]}
          >
            <Ionicons
              name={step.iconName}
              size={16}
              color={iconColor}
            />
          </Animated.View>
        </View>

        {!isLast && (
          <View style={styles.lineConnectorContainer}>
            <View
              style={[
                styles.verticalLine,
                {
                  backgroundColor:
                    nextStepState === "completed" ||
                    nextStepState === "in_progress"
                      ? "#0D9488"
                      : "#E2E8F0",
                },
              ]}
            />
          </View>
        )}
      </View>

      {/* Right Column: Step Title & Subtitle */}
      <View style={styles.rightCol}>
        <View style={styles.stepTitleRow}>
          <AppText
            weight="bold"
            style={[
              styles.stepTitle,
              { color: isCompleted || isInProgress ? "#0F172A" : "#94A3B8" },
            ]}
          >
            {step.title}
          </AppText>

          {/* Status Pill */}
          <Animated.View
            key={`${step.id}-${step.state}`}
            entering={FadeIn.duration(300)}
            style={[
              styles.statusPill,
              {
                backgroundColor: isCompleted
                  ? "#ECFDF5"
                  : isInProgress
                  ? "#F0FDFA"
                  : "#F8FAFC",
                borderColor: isCompleted
                  ? "#A7F3D0"
                  : isInProgress
                  ? "#99F6E4"
                  : "#E2E8F0",
                borderWidth: 1,
              },
            ]}
          >
            <AppText
              size="caption"
              weight="bold"
              style={{
                color: isCompleted
                  ? "#047857"
                  : isInProgress
                  ? "#0D9488"
                  : "#94A3B8",
                fontSize: 9,
              }}
            >
              {isCompleted ? "DONE" : isInProgress ? "ACTIVE" : "PENDING"}
            </AppText>
          </Animated.View>
        </View>

        <AppText size="small" color="textMuted" style={styles.stepSubtitle}>
          {step.subtitle}
        </AppText>
      </View>
    </Animated.View>
  );
}

function AnimatedCompactStepItem({
  step,
  isLast,
  nextStepState,
  styles,
}: {
  step: ProcessStep;
  isLast: boolean;
  nextStepState?: StepState;
  styles: any;
}) {
  const isCompleted = step.state === "completed";
  const isInProgress = step.state === "in_progress";

  const scale = useSharedValue(1);

  useEffect(() => {
    if (isInProgress) {
      scale.value = withRepeat(
        withSequence(
          withTiming(1.18, { duration: 700 }),
          withTiming(1, { duration: 700 })
        ),
        -1,
        true
      );
    } else {
      scale.value = withSpring(1);
    }
  }, [isInProgress]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  let circleBg = "#E2E8F0";
  if (isCompleted || isInProgress) {
    circleBg = "#0D9488"; // Teal
  }

  return (
    <React.Fragment>
      <View style={styles.compactStep}>
        <Animated.View
          style={[
            styles.compactDot,
            { backgroundColor: circleBg },
            animatedStyle,
          ]}
        >
          <Ionicons
            name={step.iconName}
            size={12}
            color={isCompleted || isInProgress ? "#FFFFFF" : "#94A3B8"}
          />
        </Animated.View>
        <AppText
          size="caption"
          weight={isInProgress || isCompleted ? "bold" : "regular"}
          style={{
            color: isCompleted
              ? "#0D9488"
              : isInProgress
              ? "#0D9488"
              : "#94A3B8",
            fontSize: 10,
            textAlign: "center",
            marginTop: 4,
          }}
          numberOfLines={1}
        >
          {step.title.split(" ")[0]}
        </AppText>
      </View>

      {!isLast && (
        <View
          style={[
            styles.compactLine,
            {
              backgroundColor:
                nextStepState === "completed" || nextStepState === "in_progress"
                  ? "#0D9488"
                  : "#E2E8F0",
            },
          ]}
        />
      )}
    </React.Fragment>
  );
}

export default function BookingProcessTracker({ booking, compact = false }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const steps = getBookingProcessSteps(booking, compact);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {steps.map((step, index) => (
          <AnimatedCompactStepItem
            key={step.id}
            step={step}
            isLast={index === steps.length - 1}
            nextStepState={steps[index + 1]?.state}
            styles={styles}
          />
        ))}
      </View>
    );
  }

  return (
    <AppCard style={styles.container}>
      <AppText weight="bold" size="h3" style={styles.cardHeaderTitle}>
        Service Timeline
      </AppText>

      <View style={styles.timelineContainer}>
        {steps.map((step, index) => (
          <AnimatedTimelineStepItem
            key={step.id}
            step={step}
            index={index}
            isLast={index === steps.length - 1}
            nextStepState={steps[index + 1]?.state}
            styles={styles}
          />
        ))}
      </View>
    </AppCard>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 20,
      borderRadius: 24,
      marginVertical: 12,
      backgroundColor: "#FFFFFF",
      borderWidth: 1,
      borderColor: "#F1F5F9",
      shadowColor: "#0F172A",
      shadowOffset: { width: 0, height: 10 },
      shadowOpacity: 0.03,
      shadowRadius: 20,
      elevation: 2,
    },
    cardHeaderTitle: {
      marginBottom: 20,
      color: "#0F172A",
      fontSize: 16,
      letterSpacing: -0.3,
    },
    timelineContainer: {
      paddingLeft: 6,
    },
    stepWrapper: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    leftCol: {
      alignItems: "center",
      marginRight: 16,
      width: 32,
    },
    iconCircle: {
      width: 32,
      height: 32,
      borderRadius: 16,
      borderWidth: 1.5,
      justifyContent: "center",
      alignItems: "center",
    },
    glowRing: {
      position: "absolute",
      width: 44,
      height: 44,
      borderRadius: 22,
      borderWidth: 2,
    },
    lineConnectorContainer: {
      alignItems: "center",
      marginVertical: 4,
      height: 38,
      justifyContent: "center",
    },
    verticalLine: {
      width: 2,
      height: 28,
      borderRadius: 1,
    },
    rightCol: {
      flex: 1,
      paddingTop: 1,
      paddingBottom: 24,
    },
    stepTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 4,
    },
    stepTitle: {
      fontSize: 14,
      letterSpacing: -0.2,
    },
    stepSubtitle: {
      fontSize: 12,
      color: "#64748B",
      lineHeight: 16,
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
    },

    // Compact mode styles for card preview
    compactContainer: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: 10,
      paddingTop: 10,
      borderTopWidth: 1,
      borderTopColor: "#F1F5F9",
    },
    compactStep: {
      alignItems: "center",
      flex: 1,
    },
    compactDot: {
      width: 28,
      height: 28,
      borderRadius: 14,
      justifyContent: "center",
      alignItems: "center",
    },
    compactLine: {
      flex: 0.5,
      height: 2,
      borderRadius: 1,
      marginTop: -12,
    },
  });
