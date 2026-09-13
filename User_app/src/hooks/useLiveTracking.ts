import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

export interface Coordinates {
    latitude: number;
    longitude: number;
    heading?: number;
}

export const useLiveTracking = (bookingId: string, initialCoords?: Coordinates | null, initialEta?: string | null) => {
    const [servicerLocation, setServicerLocation] = useState<Coordinates | null>(initialCoords || null);
    const [eta, setEta] = useState<string | null>(initialEta || null);
    const [distance, setDistance] = useState<string | null>(null);

    useEffect(() => {
        if (initialCoords) {
            setServicerLocation(initialCoords);
        }
    }, [initialCoords?.latitude, initialCoords?.longitude]);

    useEffect(() => {
        if (initialEta) {
            setEta(initialEta);
        }
    }, [initialEta]);

    useEffect(() => {
        if (!bookingId) return;

        // Join the tracking room for this booking
        socket.emit("join-tracking", { bookingId });

        const onLocationUpdate = (data: { latitude: number; longitude: number; heading?: number; eta?: string; distance?: string }) => {
            if (data?.latitude != null && data?.longitude != null) {
                setServicerLocation({
                    latitude: Number(data.latitude),
                    longitude: Number(data.longitude),
                    heading: data.heading != null ? Number(data.heading) : undefined,
                });
            }
            if (data?.eta) setEta(String(data.eta));
            if (data?.distance) setDistance(String(data.distance));
        };

        socket.on("servicer-location-update", onLocationUpdate);
        socket.on("provider-location-update", onLocationUpdate);

        return () => {
            socket.off("servicer-location-update", onLocationUpdate);
            socket.off("provider-location-update", onLocationUpdate);
            socket.emit("leave-tracking", { bookingId });
        };
    }, [bookingId]);

    return { servicerLocation, eta, distance };
};
