import 'mapbox-gl/dist/mapbox-gl.css';
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import Map, { GeolocateControl, Layer, Marker as MapGLMarker, NavigationControl, Source } from 'react-map-gl/mapbox';
import { StyleSheet, View } from 'react-native';
import { MAPBOX_ACCESS_TOKEN } from '../config/env';

const NativeMap = forwardRef(({ children, style, initialRegion, showsUserLocation, ...props }: any, ref) => {
    const mapRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
        fitToCoordinates: (coordinates: { latitude: number; longitude: number }[], options: any) => {
            if (!coordinates || coordinates.length === 0) return;

            const lngs = coordinates.map(c => c.longitude);
            const lats = coordinates.map(c => c.latitude);
            const bounds = [
                [Math.min(...lngs), Math.min(...lats)], // [minLng, minLat]
                [Math.max(...lngs), Math.max(...lats)]  // [maxLng, maxLat]
            ];

            // Convert padding
            const padding = options?.edgePadding || 50;
            // mapbox-gl fitBounds padding can be number or object

            mapRef.current?.fitBounds(bounds, { padding: padding, duration: 1000 });
        }
    }));

    return (
        <View style={[styles.container, style]}>
            <Map
                ref={mapRef}
                initialViewState={{
                    longitude: initialRegion?.longitude || -122.4,
                    latitude: initialRegion?.latitude || 37.8,
                    zoom: 14
                }}
                style={{ width: '100%', height: '100%' }}
                mapStyle="mapbox://styles/mapbox/streets-v11"
                mapboxAccessToken={MAPBOX_ACCESS_TOKEN || "pk.eyJ1IjoiZ2lnaW1hbiIsImEiOiJjbHhpZ...PLACEHOLDER"}
                {...props}
            >
                <NavigationControl position="bottom-right" />
                {showsUserLocation && <GeolocateControl position="top-right" trackUserLocation />}
                {children}
            </Map>
        </View>
    );
});

export const Marker = ({ coordinate, title, children }: any) => {
    if (!coordinate) return null;
    return (
        <MapGLMarker longitude={coordinate.longitude} latitude={coordinate.latitude} anchor="bottom">
            <View>
                {children}
            </View>
        </MapGLMarker>
    );
};

export const Polyline = ({ coordinates, strokeColor = "blue", strokeWidth = 3 }: any) => {
    if (!coordinates || coordinates.length < 2) return null;

    const geojson = {
        type: 'Feature' as const,
        geometry: {
            type: 'LineString' as const,
            coordinates: coordinates.map((c: any) => [c.longitude, c.latitude])
        },
        properties: {}
    };

    return (
        <Source type="geojson" data={geojson}>
            <Layer
                id={`line-${Math.random()}`}
                type="line"
                paint={{
                    'line-color': strokeColor,
                    'line-width': strokeWidth,
                }}
            />
        </Source>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, minHeight: 400, overflow: 'hidden' }
});

export default NativeMap;
