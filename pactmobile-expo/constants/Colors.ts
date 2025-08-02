/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { DesignSystem } from './DesignSystem';

const tintColorLight = DesignSystem.colors.neonMint;
const tintColorDark = DesignSystem.colors.neonMintVibrant;

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: DesignSystem.colors.icyAquaLight,
    background: DesignSystem.colors.charcoalBlack,
    tint: tintColorDark,
    icon: DesignSystem.colors.icyAqua,
    tabIconDefault: DesignSystem.colors.icyAqua,
    tabIconSelected: tintColorDark,
  },
  palette: {
    darkBlue: '#1a2a3a',
    lightBlue: '#00B4D8',
  },
};
