import React from 'react';
import { View, StyleSheet } from 'react-native';
import { DesignSystem } from '@/constants/DesignSystem';

interface PieChartProps {
  active: number;
  total: number;
  children?: React.ReactNode;
}

const PieChart: React.FC<PieChartProps> = ({ active, total, children }) => {
  const percentage = total > 0 ? (active / total) * 100 : 0;
  const rotation = percentage > 50 ? 180 : (percentage / 100) * 360;

  return (
    <View style={styles.container}>
      <View style={styles.outerCircle}>
        <View style={[styles.slice, { transform: [{ rotate: `${rotation}deg` }] }]} />
        {percentage > 50 && <View style={styles.slice} />}
        <View style={styles.innerCircle}>
          {children}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 150,
    height: 150,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 0, 0, 0.2)', // Light red for the inactive part
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  slice: {
    position: 'absolute',
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: DesignSystem.colors.neonMint, // Mint green for the active part
  },
  innerCircle: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: DesignSystem.colors.slateGreyBlue,
    justifyContent: 'center',
    alignItems: 'center',
    padding: DesignSystem.spacing.sm,
  },
});

export default PieChart;