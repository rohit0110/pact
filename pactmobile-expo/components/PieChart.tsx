import React from 'react';
import { View, Text } from 'react-native';
import { AnimatedCircularProgress } from 'react-native-circular-progress';

export default function AnimatedPieChart({ active, total }: { active: number, total: number }) {
  const percentage = total > 0 ? (active / total) * 100 : 0;

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <AnimatedCircularProgress
        size={150}
        width={12}
        fill={percentage}
        tintColor="#00B49F" // Active color
        backgroundColor="rgba(255, 0, 0, 0.2)" // Inactive background
        duration={800}
        rotation={0}
        lineCap="round"
      >
        {
          () => (
            <View>
              {/* Replace this with styled text if needed */}
              <Text style={{ color: '#FFF', fontWeight: 'bold', fontSize: 16 }}>
                {active} Active
              </Text>
              <Text style={{ color: '#8DFFF0', fontSize: 12 }}>
                / {total} Total
              </Text>
            </View>
          )
        }
      </AnimatedCircularProgress>
    </View>
  );
}
