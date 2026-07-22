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
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  state: StepState;
}

export function getBookingProcessSteps(booking: BookingItem): ProcessStep[] {
  const status = booking.status;
  const isFailedOrManual =
    booking.assignmentStatus === "FAILED" || status === "manual_assign";
  const isManuallyAssigned = booking.isManuallyAssigned || false;

  const steps: ProcessStep[] = [];

  // Step 1: Payment Confirmed
  const step1State: StepState = status === "cancelled" ? "pending" : "completed";
  steps.push({
    id: 1,
    iconName: "card-outline",
    title: "Payment Confirmed",
    subtitle: booking.paymentType === "ADVANCE" ? "Advance payment received" : "Payment confirmed",
    state: step1State,
  });

  // Step 2: Auto-Searching
  let step2State: StepState = "pending";
  if (["assigned", "otp", "in_progress", "completed"].includes(status) || isFailedOrManual || isManuallyAssigned) {
    step2State = "completed";
  } else if (["searching", "scheduled"].includes(status)) {
    step2State = "in_progress";
  }
  
  steps.push({
    id: 2,
    iconName: "search-outline",
    title: "Searching Technician",
    subtitle: step2State === "completed" ? "Auto-search finished" : "Searching nearby technicians...",
    state: step2State,
  });

  // Step 3: Awaiting Manual Assignment (Only if failed or manually assigned)
  if (isFailedOrManual || isManuallyAssigned) {
    let step3State: StepState = "pending";
    if (["assigned", "otp", "in_progress", "completed"].includes(status) && isManuallyAssigned) {
      step3State = "completed";
    } else if (isFailedOrManual && !isManuallyAssigned) {
      step3State = "in_progress";
    }
    
    steps.push({
      id: 3,
      iconName: "time-outline",
      title: "Awaiting Manual Assignment",
      subtitle: step3State === "completed" ? "Assigned by admin" : "Awaiting manual assignment...",
      state: step3State,
    });
  }

  // Step 4 (or 3 if no manual): Service Provider Assigned
  let step4State: StepState = "pending";
  if (["in_progress", "completed"].includes(status)) {
    step4State = "completed";
  } else if (["assigned", "otp"].includes(status)) {
    step4State = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "person-outline",
    title: "Technician Assigned",
    subtitle:
      step4State === "completed" || step4State === "in_progress"
        ? booking.name
          ? `Assigned to ${booking.name}`
          : "Service provider ready"
        : "Waiting for technician",
    state: step4State,
  });

  // Step 5 (or 4 if no manual): Service Completed
  let step5State: StepState = "pending";
  if (status === "completed") {
    step5State = "completed";
  } else if (status === "in_progress") {
    step5State = "in_progress";
  }

  steps.push({
    id: steps.length + 1,
    iconName: "checkmark-done-outline",
    title: "Service Completed",
    subtitle:
      step5State === "completed"
        ? "Service completed successfully"
        : step5State === "in_progress"
        ? "Service currently in progress"
        : "Pending completion",
    state: step5State,
  });

  return steps;
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

          if (isCompleted) {
            circleBg = "#0D9488"; // Teal
          } else if (isInProgress) {
            circleBg = "#0D9488"; // Teal
          }

          return (
            <React.Fragment key={step.id}>
              <View style={styles.compactStep}>
                <View style={[styles.compactDot, { backgroundColor: circleBg }]}>
                  <Ionicons 
                    name={step.iconName} 
                    size={12} 
                    color={isCompleted || isInProgress ? "#FFFFFF" : "#94A3B8"} 
                  />
                </View>
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

              {index < steps.length - 1 && (
                <View
                  style={[
                    styles.compactLine,
                    {
                      backgroundColor:
                        steps[index + 1].state === "completed" ||
                        steps[index + 1].state === "in_progress"
                          ? "#0D9488"
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
        Service Timeline
      </AppText>

      <View style={styles.timelineContainer}>
        {steps.map((step, index) => {
          const isCompleted = step.state === "completed";
          const isInProgress = step.state === "in_progress";

          let badgeBg = "#F8FAFC";
          let badgeBorderColor = "#E2E8F0";

          if (isCompleted) {
            badgeBg = "#ECFDF5";
            badgeBorderColor = "#34D399";
          } else if (isInProgress) {
            badgeBg = "#F0FDFA";
            badgeBorderColor = "#0D9488";
          }

          return (
            <View key={step.id} style={styles.stepWrapper}>
              {/* Left Column: Icon & Connector Line */}
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
                  <Ionicons 
                    name={step.iconName} 
                    size={16} 
                    color={isCompleted ? "#059669" : isInProgress ? "#0D9488" : "#94A3B8"} 
                  />
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
                  <View
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
