"use client";

import React from "react";

type IOSSwitchProps = {
  checked: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
};

export default function IOSSwitch({
  checked,
  onChange,
  disabled,
}: IOSSwitchProps) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
        disabled={disabled}
      />

      {/* track */}
      <div
        className="
          w-[50px] h-[28px]
          bg-[#E9E9EA]
          rounded-full
          transition-colors duration-200
          peer-checked:bg-[#FFD100]
        "
      />

      {/* thumb */}
      <div
        className="
          absolute left-[2px] top-[2px]
          w-[24px] h-[24px]
          bg-white
          rounded-full
          transition-transform duration-200 ease-in-out
          peer-checked:translate-x-[22px]
          shadow-sm
        "
      />
    </label>
  );
}