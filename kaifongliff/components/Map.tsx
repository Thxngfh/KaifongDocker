"use client";

import { useEffect, useRef, useCallback } from "react";
import { FaLocationDot } from "react-icons/fa6";

interface LocationResult {
  name: string;
  address: string;
  lat: number;
  lng: number;
  province?: string;
  district?: string;
}

interface MapProps {
  center?: { lat: number; lng: number } | null;
  onLocationChange?: (result: LocationResult) => void;
  // ยังคง prop เดิมไว้ให้ page.tsx ไม่ต้องแก้มาก
  onMarkerSelect?: (result: LocationResult) => void;
}

const Map = ({ center = null, onLocationChange, onMarkerSelect }: MapProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackRef = useRef<((r: LocationResult) => void) | undefined>(undefined);

  // รวม callback สองตัวเป็นตัวเดียว
  useEffect(() => {
    callbackRef.current = onLocationChange ?? onMarkerSelect;
  }, [onLocationChange, onMarkerSelect]);

  const reverseGeocode = useCallback((position: google.maps.LatLng) => {
    if (!window.google?.maps?.Geocoder) return;
    new window.google.maps.Geocoder().geocode({ location: position }, (results, status) => {
      if (status !== window.google.maps.GeocoderStatus.OK || !results?.[0]) return;
      const comps = results[0].address_components ?? [];
      let province = "", district = "";
      for (const c of comps) {
        const types = c.types ?? [];
        if (types.includes("administrative_area_level_1")) province = c.long_name;
        if (types.includes("administrative_area_level_2")) district = c.long_name;
        if (!district && types.includes("sublocality_level_1")) district = c.long_name;
        if (!district && types.includes("locality")) district = c.long_name;
      }
      callbackRef.current?.({
        name: "",
        address: results[0].formatted_address ?? "",
        lat: position.lat(),
        lng: position.lng(),
        province: province || undefined,
        district: district || undefined,
      });
    });
  }, []);

  useEffect(() => {
    const init = () => {
      if (!window.google || !mapRef.current) { setTimeout(init, 100); return; }

      const bangkok = new google.maps.LatLng(13.736717, 100.523186);
      const map = new google.maps.Map(mapRef.current!, {
        center: center ? { lat: center.lat, lng: center.lng } : bangkok,
        zoom: 15,
        streetViewControl: false,
        mapTypeControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      // reverse geocode ครั้งแรก
      reverseGeocode(center ? new google.maps.LatLng(center.lat, center.lng) : bangkok);

      // map หยุดเลื่อน → reverse geocode
      map.addListener("idle", () => {
        const c = map.getCenter();
        if (!c) return;
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => reverseGeocode(c), 400);
      });
    };

    init();
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      mapInstanceRef.current = null;
    };
  }, [reverseGeocode]);

  // SearchBar เลือก → panTo
  useEffect(() => {
    if (!center || !mapInstanceRef.current) return;
    mapInstanceRef.current.panTo({ lat: center.lat, lng: center.lng });
  }, [center]);

  return (
    <div style={{ position: "relative" }} className="w-full h-[500px] rounded-2xl overflow-hidden">
      {/* Fixed pin ตรงกลาง */}
      <div style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -100%)",
        zIndex: 10, pointerEvents: "none",
        filter: "drop-shadow(0 2px 2px rgba(0,0,0,.35))",
        userSelect: "none", fontSize: 40, lineHeight: 1,
      }}>
        {/* 📍 */}
        <FaLocationDot color="#FF6060"/>
      </div>

      <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
    </div>
  );
};

export default Map;