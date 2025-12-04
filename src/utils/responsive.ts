// src/utils/responsive.ts
import { Dimensions } from "react-native";

const { width, height } = Dimensions.get("window");

export const wp = (percent: number) => (width * percent) / 100;
export const hp = (percent: number) => (height * percent) / 100;






// Use wp(percent)

// Icon width/height

// SVG sizes

// Circular elements

// Card width

// Grid layout spacing

// Button width
// --------------------------------------------------------
// Use hp(percent)

// Vertical spacing

// Banner images height

// Screen sections

// Bottom sheet height

// Header top padding

// Modal container heigh