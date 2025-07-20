declare module 'react-native-vector-icons/Ionicons' {
  import { Icon } from 'react-native-vector-icons/Icon';
  import { ComponentType } from 'react';
  interface IoniconsProps {
    name: string;
    size?: number;
    color?: string;
    style?: any;
  }
  const Ionicons: ComponentType<IoniconsProps>;
  export default Ionicons;
}