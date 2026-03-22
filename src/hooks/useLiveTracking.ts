import { useEffect, useState } from "react";
import { socket } from "../socket/socket";

export interface Coordinates {
    latitude: number;
    longitude: number;
    heading?: number;
}

export const useLiveTracking = (bookingId: string) => {
    const [servicerLocation, setServicerLocation] = useState<Coordinates | null>(null);
    const [eta, setEta] = useState<string | null>(null);

    useEffect(() => {
        if (!bookingId) return;

        // Join the tracking room for this booking
        console.log("[SOCKET EMIT] 📤 join-tracking:", bookingId);
        socket.emit("join-tracking", { bookingId });

        const onLocationUpdate = (data: { latitude: number; longitude: number; heading?: number, eta?: string }) => {
            console.log("[SOCKET RECEIVE] 📍 servicer-location-update:", data);
            setServicerLocation({
                latitude: data.latitude,
                longitude: data.longitude,
                heading: data.heading,
            });
            if (data.eta) setEta(data.eta);
        };

        socket.on("servicer-location-update", onLocationUpdate);

        return () => {
            socket.off("servicer-location-update", onLocationUpdate);
            console.log("[SOCKET EMIT] 📤 leave-tracking:", bookingId);
            socket.emit("leave-tracking", { bookingId });
        };
    }, [bookingId]);

    return { servicerLocation, eta };
};
