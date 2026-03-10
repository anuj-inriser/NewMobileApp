import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';
import { useSparkline } from '../hooks/useIntervalData';

const SparklineChart = ({ symbol, color = '#00c853', width = 100, height = 40 }) => {
  const { data, isLoading } = useSparkline(symbol);

  if (isLoading) {
    return (
      <View style={[styles.container, { width, height }]}>
        <ActivityIndicator size="small" color={color} />
      </View>
    );
  }

  if (!data || data.length < 2) {
    return <View style={[styles.container, { width, height }]} />;
  }

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min === 0 ? 1 : max - min;

  // Normalize points to SVG coordinates
  const points = data.map((val, i) => ({
    x: (i / (data.length - 1)) * width,
    y: height - ((val - min) / range) * height,
  }));

  // Create SVG path string
  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x} ${points[i].y}`;
  }

  // Create closed path for gradient fill
  const fillD = `${d} L ${width} ${height} L 0 ${height} Z`;

  return (
    <View style={[styles.container, { width, height }]}>
      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={color} stopOpacity="0.3" />
            <Stop offset="1" stopColor={color} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Path d={fillD} fill="url(#gradient)" />
        <Path d={d} fill="none" stroke={color} strokeWidth="2" />
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SparklineChart;
