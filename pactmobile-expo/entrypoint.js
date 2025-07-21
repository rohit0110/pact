// entrypoint.js

// 🧩 Required polyfills for Privy
import 'fast-text-encoding';
import 'react-native-get-random-values';
import '@ethersproject/shims';
import { Buffer } from 'buffer';
global.Buffer = Buffer;

// 🚀 Start the app via Expo Router
import 'expo-router/entry';
