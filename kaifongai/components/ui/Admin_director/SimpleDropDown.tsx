import * as React from "react";
import MenuItem from "@mui/material/MenuItem";
import FormControl from "@mui/material/FormControl";
import Select from "@mui/material/Select";

type Props = {
  value: string;
  onChange: (value: string) => void;
};

export default function SimpleDropDown({ value, onChange }: Props) {
  return (
    <FormControl size="small" sx={{ minWidth: 140 }}>
      <Select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        displayEmpty
        sx={{
          borderRadius: 2,
          backgroundColor: "#FAF8FF",
          "& fieldset": {
            borderColor: "rgba(209, 198, 171, 0.3)",
          },
          minWidth: 200,
          "& .MuiSelect-select": {
            paddingTop: "12px",
            paddingBottom: "12px",
            paddingLeft: "24px",
          },
         

          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "rgba(209, 198, 171, 0.3)",
          },

          "&.Mui-focused": {
            boxShadow: "none",
          },
        }}
      >
        <MenuItem value="">ทุกสถานะ</MenuItem>
        <MenuItem value="active">เปิดใช้งาน</MenuItem>
        <MenuItem value="inactive">ปิดใช้งาน</MenuItem>
      </Select>
    </FormControl>
  );
}