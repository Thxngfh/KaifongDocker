"use client";
import { Search } from 'lucide-react';
import React, { useEffect, useRef } from 'react';

interface SearchBarProps {
  onPlaceSelect?: (place: {
    name: string;
    address: string;
    lat: number;
    lng: number;
    province?: string;
    district?: string;
  }) => void;
}

const SearchBar = ({ onPlaceSelect }: SearchBarProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = () => {
      if (!window.google || !inputRef.current) {
        setTimeout(init, 100);
        return;
      }
      
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
        componentRestrictions: { country: "th" }, 
        fields: ["name", "geometry", "formatted_address", "address_components"],
      });

      autocomplete.addListener("place_changed", () => {
        const place = autocomplete.getPlace();
        if (!place.geometry?.location) return;

        const comps = place.address_components ?? [];
        let province = "";
        let district = "";
        for (const c of comps) {
          const types = c.types || [];
          if (types.includes("administrative_area_level_1")) province = c.long_name;
          if (types.includes("administrative_area_level_2")) district = c.long_name;
          if (!district && types.includes("sublocality_level_1")) district = c.long_name;
          if (!district && types.includes("locality")) district = c.long_name;
        }

        onPlaceSelect?.({
          name: place.name ?? "",
          address: place.formatted_address ?? "",
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng(),
          province: province || undefined,
          district: district || undefined,
        });
      });
    };

    init();
  }, []);

  return (
    <div>
      <div className='px-10 pt-10'>
        <div className="relative">
          <Search className="text-[#4D4632] pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
          <input
            ref={inputRef}
            type="search"
            placeholder="ค้นหาสถานที่หรือที่อยู่..."
            className="bg-[#F4F4F1] placeholder:text-[#4D4632]/50 focus-visible:ring-ring h-12 w-full rounded-xl pr-4 pl-12 text-sm"
          />
        </div>
      </div>
    </div>
  );
};

export default SearchBar;