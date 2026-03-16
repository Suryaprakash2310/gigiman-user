// import React, { forwardRef, useImperativeHandle, useRef } from "react";
// import { StyleSheet, View } from "react-native";
// // import { MAPBOX_ACCESS_TOKEN } from "../config/env";
// // Set your access token here
// const MAPBOX_ACCESS_TOKEN = "";

// interface MapViewProps {
//     children?: React.ReactNode;
//     style?: any;
//     initialRegion?: {
//         latitude: number;
//         longitude: number;
//         latitudeDelta: number;
//         longitudeDelta: number;
//     };
//     showsUserLocation?: boolean;
//     showsMyLocationButton?: boolean; // Not directly supported, ignored for now
// }

// const NativeMap = forwardRef(({ children, style, initialRegion, showsUserLocation, ...props }: MapViewProps, ref) => {
//     const cameraRef = useRef<MapboxGL.Camera>(null);
//     const mapRef = useRef<MapboxGL.MapView>(null);

//     useImperativeHandle(ref, () => ({
//         fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options: any) => {
//             if (!coordinates || coordinates.length === 0) return;

//             const lons = coordinates.map(c => c.longitude);
//             const lats = coordinates.map(c => c.latitude);

//             const ne = [Math.max(...lons), Math.max(...lats)];
//             const sw = [Math.min(...lons), Math.min(...lats)];

//             // Convert simple edge padding to array if needed or just pass numbers
//             const padding = options?.edgePadding;
//             const top = padding?.top || 50;
//             const right = padding?.right || 50;
//             const bottom = padding?.bottom || 50;
//             const left = padding?.left || 50;

//             cameraRef.current?.fitBounds(ne as [number, number], sw as [number, number], [top, right, bottom, left], 1000);
//         }
//     }));

//     return (
//         <MapboxGL.MapView style={[styles.map, style]} {...props} ref={mapRef} styleURL={MapboxGL.StyleURL.Street}>
//             <MapboxGL.Camera
//                 ref={cameraRef}
//                 zoomLevel={14}
//                 centerCoordinate={initialRegion ? [initialRegion.longitude, initialRegion.latitude] : undefined}
//                 animationMode="flyTo"
//                 animationDuration={2000}
//             />
//             {showsUserLocation && <MapboxGL.UserLocation visible={true} />}
//             {children}
//         </MapboxGL.MapView>
//     );
// });

// export const Marker = ({ coordinate, title, description, children, ...props }: any) => {
//     if (!coordinate) return null;
//     return (
//         <MapboxGL.PointAnnotation
//             id={`marker-${coordinate.latitude}-${coordinate.longitude}-${Math.random()}`}
//             coordinate={[coordinate.longitude, coordinate.latitude]}
//             title={title}
//         >
//             {children || <View style={styles.defaultMarker} />}
//             <MapboxGL.Callout title={title} />
//         </MapboxGL.PointAnnotation>
//     );
// };

// export const Polyline = ({ coordinates, strokeColor = "#0000FF", strokeWidth = 3, lineDashPattern, ...props }: any) => {
//     if (!coordinates || coordinates.length < 2) return null;

//     const lineString = {
//         type: "Feature",
//         properties: {},
//         geometry: {
//             type: "LineString",
//             coordinates: coordinates.map((c: any) => [c.longitude, c.latitude]),
//         },
//     } as any;

//     return (
//         <MapboxGL.ShapeSource id={`polyline-source-${Math.random()}`} shape={lineString}>
//             <MapboxGL.LineLayer
//                 id={`polyline-layer-${Math.random()}`}
//                 style={{
//                     lineColor: strokeColor,
//                     lineWidth: strokeWidth,
//                     lineCap: "round",
//                     lineJoin: "round",
//                     lineDasharray: lineDashPattern ? [2, 2] : undefined,
//                 }}
//             />
//         </MapboxGL.ShapeSource>
//     );
// };

// const styles = StyleSheet.create({
//     map: { flex: 1 },
//     defaultMarker: {
//         width: 20,
//         height: 20,
//         borderRadius: 10,
//         backgroundColor: 'red',
//         borderWidth: 2,
//         borderColor: 'white'
//     }
// });

// export default NativeMap;
