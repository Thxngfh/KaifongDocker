"use client";
import * as React from "react";
import IconButton from "@mui/material/IconButton";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import MoreVertIcon from "@mui/icons-material/MoreVert";

interface OptionsMenuProps {
    options: string[];              // ตัวเลือกทั้งหมด
    defaultValue?: string;           // ค่าที่เลือกเป็น default
    onSelect?: (value: string) => void;  // callback เวลาผู้ใช้เลือก
}

export default function OptionsMenu({ options, defaultValue, onSelect }: OptionsMenuProps) {
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const [selected, setSelected] = React.useState(defaultValue || options[0]);
    const open = Boolean(anchorEl);

    const handleClick = (event: React.MouseEvent<HTMLElement>) => setAnchorEl(event.currentTarget);

    const handleClose = (value?: string) => {
        setAnchorEl(null);
        if (value) {
            setSelected(value);
            if (onSelect) onSelect(value);
        }
    };

    return (
        <div>
            <IconButton onClick={handleClick} size="small">
                <MoreVertIcon fontSize="large" />
            </IconButton>

            <Menu 
                anchorEl={anchorEl}
                open={open}
                onClose={() => handleClose()}
                slotProps={{
                    paper: { sx: { minWidth: 120 } },
                }}
                 anchorOrigin={{ vertical: "top", horizontal: "right" }}
                 transformOrigin={{ vertical: "top", horizontal: "left" }}
            >
                {options.map((option) => (
                    <MenuItem
                        key={option}
                        selected={option === selected}
                        onClick={() => handleClose(option)}
                    >
                        {option}
                    </MenuItem>
                ))}
            </Menu>
        </div>
    );
}