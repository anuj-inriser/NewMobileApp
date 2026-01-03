import React from "react";
import { View, Text } from "react-native";
import Svg, { Circle, G } from "react-native-svg";

const KycChart = ({
  radius = 16,
  strokeWidth = 4,
  percentage,  // center text percentage
  color = "#210F47",
  bgColor = "#E5DDF3",
}) => {
  const normalizedRadius = radius - strokeWidth / 2;
  const circumference = 2 * Math.PI * normalizedRadius;
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={{ justifyContent: "center", alignItems: "center" }}>
      <Svg height={radius * 2} width={radius * 2}>
        <G rotation="-90" origin={`${radius}, ${radius}`}>
          {/* Background Circle */}
          <Circle
            stroke={bgColor}
            fill="none"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
          />

          {/* Foreground Progress */}
          <Circle
            stroke={color}
            fill="none"
            cx={radius}
            cy={radius}
            r={normalizedRadius}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </G>
      </Svg>

      {/* Center Text */}
      <View style={{ position: "absolute" }}>
        <Text style={{ fontSize: 7, fontWeight: "700", color: "#210F47" }}>
          {percentage}%
        </Text>
      </View>
    </View>
  );
};

export default KycChart;