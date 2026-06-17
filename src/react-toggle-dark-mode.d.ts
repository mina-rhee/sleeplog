declare module "react-toggle-dark-mode" {
  import * as React from "react";

  export interface DarkModeSwitchProps {
    onChange: (checked: boolean) => void;
    checked: boolean;
    style?: React.CSSProperties;
    size?: number | string;
    sunColor?: string;
    moonColor?: string;
    className?: string;
  }

  export const DarkModeSwitch: React.FC<DarkModeSwitchProps>;
}
