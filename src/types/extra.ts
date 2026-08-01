import type { ButtonHTMLAttributes } from "react";

import type { ButtonProps as ReusableButtonProps } from "../components/Button";

export type ButtonProps = ReusableButtonProps;

export interface SidebarRoute {
  name: string;
  path: string;
  iconName: string;
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  hidden?: boolean;
}
