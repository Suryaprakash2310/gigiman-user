// import api from "@/src/api/client";
// import MapView, { Marker, Polyline } from "@/src/components/NativeMap.web";
// import AppHeader from "@/src/components/ui/AppHeader";
// import AppText from "@/src/components/ui/AppText";
// import { useBooking } from "@/src/context/BookingContext";
// import { useLiveTracking } from "@/src/hooks/useLiveTracking";
// import { BookingParamList } from "@/src/navigation/stacks/BookingStack";
// import { useTheme } from "@/src/theme/useTheme";
// import { getCurrentLocation } from "@/src/utils/location";
// import { mapBookingToBookingItem } from "@/src/utils/mapBooking";
// import { Ionicons } from "@expo/vector-icons";
// import { RouteProp, useNavigation, useRoute } from "@react-navigation/native";
// import React, { useEffect, useRef, useState } from "react";
// import { ActivityIndicator, StyleSheet, TouchableOpacity, View } from "react-native";

// type DetailsRoute = RouteProp<BookingParamList, "LiveTracking">;

// export default function LiveTrackingScreen() {
//     const { theme } = useTheme();
//     const route = useRoute<DetailsRoute>();
//     const navigation = useNavigation();
//     const { bookingId } = route.params;
//     const { getBookingById, upsertBooking } = useBooking();
//     const mapRef = useRef<any>(null);

//     const booking = getBookingById(bookingId);
//     const { servicerLocation, eta } = useLiveTracking(bookingId);

//     // Fetch full booking from API to ensure technician name is available
//     useEffect(() => {
//         const fetchBooking = async () => {
//             try {
//                 const res = await api.get(`/booking/${bookingId}`);
//                 if (res.data?.booking) {
//                     const mapped = mapBookingToBookingItem(res.data.booking);
//                     upsertBooking(mapped);
//                 }
//             } catch (err) {
//                 console.warn("Failed to fetch booking details:", err);
//             }
//         };
//         // Only fetch if technician name is missing
//         if (!booking?.name) {
//             fetchBooking();
//         }
//     }, [bookingId]);

//     // Get real user location
//     const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
//     const [locationError, setLocationError] = useState(false);

//     useEffect(() => {
//         const fetchLocation = async () => {
//             try {
//                 const loc = await getCurrentLocation();
//                 setUserLocation({ latitude: loc.latitude, longitude: loc.longitude });
//             } catch (err) {
//                 console.warn("Failed to get user location:", err);
//                 setLocationError(true);
//                 // Fallback to a default location
//                 setUserLocation({ latitude: 10.9393, longitude: 79.5321 });
//             }
//         };
//         fetchLocation();
//     }, []);

//     // Auto-fit map to show both markers when servicer location updates
//     useEffect(() => {
//         if (servicerLocation && userLocation && mapRef.current) {
//             mapRef.current.fitToCoordinates(
//                 [servicerLocation, userLocation],
//                 {
//                     edgePadding: { top: 80, right: 80, bottom: 200, left: 80 },
//                     animated: true,
//                 }
//             );
//         }
//     }, [servicerLocation, userLocation]);

//     // Handle phone call
//     const handleCall = () => {
//         // Phone will be available when backend includes it
//         console.log("Call technician");
//     };

//     if (!booking) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <AppText style={{ marginTop: 12 }}>Loading booking...</AppText>
//             </View>
//         );
//     }

//     if (!userLocation) {
//         return (
//             <View style={styles.center}>
//                 <ActivityIndicator size="large" color={theme.colors.primary} />
//                 <AppText style={{ marginTop: 12 }}>Getting your location...</AppText>
//             </View>
//         );
//     }

//     return (
//         <View style={styles.container}>
//             <AppHeader title="Track Technician" showBack />

//             {/* 🗺️ MAP CONTAINER */}
//             <View style={styles.mapContainer}>
//                 <MapView
//                     ref={mapRef}
//                     style={StyleSheet.absoluteFill}
//                     initialRegion={{
//                         latitude: userLocation.latitude,
//                         longitude: userLocation.longitude,
//                         latitudeDelta: 0.05,
//                         longitudeDelta: 0.05,
//                     }}
//                     showsUserLocation={true}
//                     showsMyLocationButton={true}
//                 >
//                     {/* Servicer (Technician) Marker */}
//                     {servicerLocation && (
//                         <Marker
//                             coordinate={servicerLocation}
//                             title={booking.name || "Technician"}
//                             description="Your technician is on the way!"
//                         >
//                             <View style={styles.markerContainer}>
//                                 <Ionicons name="construct" size={20} color="white" />
//                             </View>
//                         </Marker>
//                     )}

//                     {/* User's Location Marker */}
//                     <Marker
//                         coordinate={userLocation}
//                         title="Your Location"
//                     >
//                         <View style={styles.userMarker}>
//                             <Ionicons name="home" size={18} color="white" />
//                         </View>
//                     </Marker>

//                     {/* Line connecting servicer to user */}
//                     {servicerLocation && (
//                         <Polyline
//                             coordinates={[servicerLocation, userLocation]}
//                             strokeColor={theme.colors.primary}
//                             strokeWidth={3}
//                             lineDashPattern={[10, 5]}
//                         />
//                     )}
//                 </MapView>

//                 {/* Waiting overlay if no servicer location yet */}
//                 {!servicerLocation && (
//                     <View style={styles.waitingOverlay}>
//                         <View style={styles.waitingBadge}>
//                             <ActivityIndicator size="small" color="#0F766E" />
//                             <AppText size="small" weight="bold" style={{ marginLeft: 8, color: "#0F766E" }}>
//                                 Waiting for technician location...
//                             </AppText>
//                         </View>
//                     </View>
//                 )}
//             </View>

//             {/* 🚗 BOTTOM SHEET INFO */}
//             <View style={[styles.bottomSheet, { backgroundColor: theme.colors.surface }]}>
//                 <View style={styles.handle} />

//                 <View style={styles.infoRow}>
//                     <AppText weight="bold" size="h3">
//                         {servicerLocation
//                             ? `Arriving in ${eta || "calculating..."}`
//                             : "Technician on the way"}
//                     </AppText>
//                     <View style={[
//                         styles.statusBadge,
//                         { backgroundColor: servicerLocation ? "#10B981" : "#F59E0B" }
//                     ]}>
//                         <AppText size="small" style={{ color: "white" }}>
//                             {servicerLocation ? "On the way" : "Starting"}
//                         </AppText>
//                     </View>
//                 </View>

//                 <View style={styles.driverRow}>
//                     <View style={styles.driverAvatar}>
//                         <Ionicons name="person" size={24} color="#64748B" />
//                     </View>
//                     <View style={{ flex: 1, marginLeft: 12 }}>
//                         <AppText weight="bold">{booking.name || "Assigned Technician"}</AppText>
//                         <AppText size="small" color="textMuted">{booking.serviceCategoryName}</AppText>
//                     </View>

//                     <TouchableOpacity style={styles.callButton} onPress={handleCall}>
//                         <Ionicons name="call" size={20} color="white" />
//                     </TouchableOpacity>
//                 </View>
//             </View>
//         </View>
//     );
// }

// const styles = StyleSheet.create({
//     container: {
//         flex: 1,
//         backgroundColor: "#F8FAFC",
//     },
//     center: {
//         flex: 1,
//         justifyContent: "center",
//         alignItems: "center",
//     },
//     mapContainer: {
//         flex: 1,
//         position: 'relative',
//     },
//     markerContainer: {
//         padding: 8,
//         borderRadius: 20,
//         backgroundColor: "#0F766E",
//         borderWidth: 2,
//         borderColor: "white",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 4,
//         elevation: 5,
//     },
//     userMarker: {
//         padding: 8,
//         borderRadius: 20,
//         backgroundColor: "#3B82F6",
//         borderWidth: 2,
//         borderColor: "white",
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.25,
//         shadowRadius: 4,
//         elevation: 5,
//     },
//     waitingOverlay: {
//         position: "absolute",
//         top: 16,
//         left: 16,
//         right: 16,
//         alignItems: "center",
//     },
//     waitingBadge: {
//         flexDirection: "row",
//         alignItems: "center",
//         backgroundColor: "white",
//         paddingHorizontal: 16,
//         paddingVertical: 10,
//         borderRadius: 20,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 4,
//         elevation: 3,
//     },
//     bottomSheet: {
//         padding: 24,
//         borderTopLeftRadius: 24,
//         borderTopRightRadius: 24,
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: -2 },
//         shadowOpacity: 0.1,
//         shadowRadius: 8,
//         elevation: 10,
//     },
//     handle: {
//         width: 40,
//         height: 4,
//         backgroundColor: "#CBD5E1",
//         borderRadius: 2,
//         alignSelf: "center",
//         marginBottom: 16,
//     },
//     infoRow: {
//         flexDirection: "row",
//         justifyContent: "space-between",
//         alignItems: "center",
//         marginBottom: 20,
//     },
//     statusBadge: {
//         paddingHorizontal: 10,
//         paddingVertical: 4,
//         borderRadius: 12,
//     },
//     driverRow: {
//         flexDirection: "row",
//         alignItems: "center",
//     },
//     driverAvatar: {
//         width: 48,
//         height: 48,
//         borderRadius: 24,
//         backgroundColor: "#F1F5F9",
//         alignItems: "center",
//         justifyContent: "center",
//     },
//     callButton: {
//         width: 44,
//         height: 44,
//         borderRadius: 22,
//         backgroundColor: "#0F766E",
//         alignItems: "center",
//         justifyContent: "center",
//     },
// });
