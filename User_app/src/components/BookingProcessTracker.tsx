import AppCard from "@/src/components/ui/AppCard";
import AppText from "@/src/components/ui/AppText";
import { BookingItem } from "@/src/context/BookingContext";
import { useTheme } from "@/src/theme/useTheme";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, View } from "react-native";

interface Props {
  booking: BookingItem;
  compact?: boolean;
}

export type StepState = "completed" | "in_progress" | "pending";

export interface ProcessStep {
  id: number;
  emoji: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  state: StepState;
}

export function getBookingProcessSteps(booking: BookingItem): ProcessStep[] {
  const status = booking.status;
  const isFailedOrManual =
    booking.assignmentStatus === "FAILED" || status === "manual_assign";

  // Step 1: Payment Confirmed
  const step1State: StepState =
    status === "cancelled" ? "pending" : "completed";

  // Step 2: Assigning Service Provider
  let step2State: StepState = "pending";
  if (["assigned", "otp", "in_progress", "completed"].includes(status)) {
    step2State = "completed";
  } else if (
    ["searching", "scheduled"].includes(status) ||
    isFailedOrManual
  ) {
    step2State = "in_progress";
  }

  // Step 3: Service Provider Assigned
  let step3State: StepState = "pending";
  if (["in_progress", "completed"].includes(status)) {
    step3State = "completed";
  } else if (["assigned", "otp"].includes(status)) {
    step3State = "in_progress";
  }

  // Step 4: Service Completed
  let step4State: StepState = "pending";
  if (status === "completed") {
    step4State = "completed";
  } else if (status === "in_progress") {
    step4State = "in_progress";
  }

  // Subtitle descriptions
  const step2Subtitle =
    step2State === "completed"
      ? "Provider allocated"
      : isFailedOrManual
      ? "Awaiting manual assignment"
      : "Searching nearby technician...";

  const step3Subtitle =
    step3State === "completed" || step3State === "in_progress"
      ? booking.name
        ? `Assigned to ${booking.name}`
        : "Service provider ready"
      : "Waiting for assignment";

  const step4Subtitle =
    step4State === "completed"
      ? "Service completed successfully"
      : step4State === "in_progress"
      ? "Service currently in progress"
      : "Pending completion";

  return [
    {
      id: 1,
      emoji: "✅",
      iconName: "checkmark-circle",
      title: "Payment Confirmed",
      subtitle: booking.paymentType === "ADVANCE" ? "Advance payment received" : "Payment confirmed",
      state: step1State,
    },
    {
      id: 2,
      emoji: "🔄",
      iconName: "sync-circle",
      title: "Assigning Service Provider",
      subtitle: step2Subtitle,
      state: step2State,
    },
    {
      id: 3,
      emoji: "👨‍🔧",
      iconName: "person-circle",
      title: "Service Provider Assigned",
      subtitle: step3Subtitle,
      state: step3State,
    },
    {
      id: 4,
      emoji: "✅",
      iconName: "checkmark-done-circle",
      title: "Service Completed",
      subtitle: step4Subtitle,
      state: step4State,
    },
  ];
}

export default function BookingProcessTracker({ booking, compact = false }: Props) {
  const { theme } = useTheme();
  const styles = createStyles(theme);
  const steps = getBookingProcessSteps(booking);

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        {steps.map((step, index) => {
          const isCompleted = step.state === "completed";
          const isInProgress = step.state === "in_progress";

          let circleBg = "#E2E8F0";
          let iconColor = "#94A3B8";

          if (isCompleted) {
            circleBg = "#10B981";
            iconColor = "#FFFFFF";
          } else if (isInProgress) {
            circleBg = theme.colors.primary;
            iconColor = "#FFFFFF";
          }

          return (
            <React.Fragment key={step.id}>
              <View style={styles.compactStep}>
                <View style={[styles.compactDot, { backgroundColor: circleBg }]}>
                  <AppText style={styles.compactEmoji}>{step.emoji}</AppText>
                </View>
                <AppText
                  size="caption"
                  weight={isInProgress || isCompleted ? "bold" : "regular"}
                  style={{
                    color: isCompleted
                      ? "#10B981"
                      : isInProgress
                      ? theme.colors.primary
                      : "#94A3B8",
                    fontSize: 10,
                    textAlign: "center",
                    marginTop: 2,
                  }}
                  numberOfLines={1}
                >
                  {step.title.split(" ")[0]}
                </AppText>
              </View>

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.compactLine,
                    {
                      backgroundColor:
                        steps[index + 1].state === "completed" ||
                        steps[index + 1].state === "in_progress"
                          ? "#10B981"
                          : "#E2E8F0",
                    },
                  ]}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    );
  }

  return (
    <AppCard style={styles.container}>
      <AppText weight="bold" size="h3" style={styles.cardHeaderTitle}>
        Booking Status
      </AppText>

      <View style={styles.timelineContainer}>
        {steps.map((step, index) => {
          const isCompleted = step.state === "completed";
          const isInProgress = step.state === "in_progress";

          let badgeBg = "#F1F5F9";
          let badgeBorderColor = "#CBD5E1";
          let textColor = "#64748B";

          if (isCompleted) {
            badgeBg = "#ECFDF5";
            badgeBorderColor = "#10B981";
            textColor = "#065F46";
          } else if (isInProgress) {
            badgeBg = "#EFF6FF";
            badgeBorderColor = theme.colors.primary;
            textColor = theme.colors.primary;
          }

          return (
            <View key={step.id} style={styles.stepWrapper}>
              {/* Left Column: Emoji/Icon & Connector Line */}
              <View style={styles.leftCol}>
                <View
                  style={[
                    styles.iconCircle,
                    {
                      backgroundColor: badgeBg,
                      borderColor: badgeBorderColor,
                    },
                  ]}
                >
                  <AppText style={styles.emojiText}>{step.emoji}</AppText>
                </View>

                {index < steps.length - 1 && (
                  <View style={styles.lineConnectorContainer}>
                    <View
                      style={[
                        styles.verticalLine,
                        {
                          backgroundColor:
                            steps[index + 1].state === "completed" ||
                            steps[index + 1].state === "in_progress"
                              ? "#10B981"
                              : "#E2E8F0",
                        },
                      ]}
                    />
                    <AppText
                      style={[
                        styles.downArrow,
                        {
                          color:
                            steps[index + 1].state === "completed" ||
                            steps[index + 1].state === "in_progress"
                              ? "#10B981"
                              : "#CBD5E1",
                        },
                      ]}
                    >
                      ↓
                    </AppText>
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
                  <View
                    style={[
                      styles.statusPill,
                      {
                        backgroundColor: isCompleted
                          ? "#DCFCE7"
                          : isInProgress
                          ? "#DBEAFE"
                          : "#F1F5F9",
                      },
                    ]}
                  >
                    <AppText
                      size="caption"
                      weight="bold"
                      style={{
                        color: isCompleted
                          ? "#166534"
                          : isInProgress
                          ? "#1D4ED8"
                          : "#94A3B8",
                        fontSize: 10,
                      }}
                    >
                      {isCompleted ? "DONE" : isInProgress ? "IN PROGRESS" : "PENDING"}
                    </AppText>
                  </View>
                </View>

                <AppText size="small" color="textMuted" style={styles.stepSubtitle}>
                  {step.subtitle}
                </AppText>
              </View>
            </View>
          );
        })}
      </View>
    </AppCard>
  );
}

const createStyles = (theme: any) =>
  StyleSheet.create({
    container: {
      padding: 16,
      borderRadius: 20,
      marginVertical: 12,
      backgroundColor: "#FFFFFF",
      elevation: 3,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
    },
    cardHeaderTitle: {
      marginBottom: 16,
      color: "#0F172A",
    },
    timelineContainer: {
      paddingLeft: 4,
    },
    stepWrapper: {
      flexDirection: "row",
      alignItems: "flex-start",
    },
    leftCol: {
      alignItems: "center",
      marginRight: 14,
      width: 40,
    },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 2,
      justifyContent: "center",
      alignItems: "center",
    },
    emojiText: {
      fontSize: 20,
    },
    lineConnectorContainer: {
      alignItems: "center",
      marginVertical: 2,
      height: 34,
      justifyContent: "center",
    },
    verticalLine: {
      width: 2,
      height: 18,
      borderRadius: 1,
    },
    downArrow: {
      fontSize: 14,
      fontWeight: "bold",
      marginTop: -2,
    },
    rightCol: {
      flex: 1,
      paddingTop: 2,
      paddingBottom: 20,
    },
    stepTitleRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 2,
    },
    stepTitle: {
      fontSize: 14,
    },
    stepSubtitle: {
      fontSize: 12,
      color: "#64748B",
    },
    statusPill: {
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 12,
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
    compactEmoji: {
      fontSize: 13,
    },
    compactLine: {
      flex: 0.5,
      height: 2,
      borderRadius: 1,
      marginTop: -12,
    },
  });
