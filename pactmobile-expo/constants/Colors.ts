/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#14F1B2';
const tintColorDark = '#14F1B2';

export const Colors = {
  light: {
    text: '#0F0F0F',
    background: '#FFFFFF',
    tint: tintColorLight,
    icon: '#134156',
    tabIconDefault: '#134156',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#FFFFFF',
    background: '#0F0F0F',
    tint: tintColorDark,
    icon: '#8DFFF0',
    tabIconDefault: '#8DFFF0',
    tabIconSelected: tintColorDark,
  },
  palette: {
    black: '#0F0F0F',
    darkBlue: '#0E151A',
    blue: '#134156',
    teal: '#00B49F',
    lightGreen: '#14F1B2',
    lightBlue: '#8DFFF0',
    lightestBlue: '#C5FFF8',
    white: '#FFFFFF',
  }
};