import React from "react";
import { TextInput as RNTextInput } from "react-native";

export default function TextInput(props) {
  return (
    <RNTextInput
      {...props}
      placeholderTextColor="#000"
      style={[
        {
          color: "#000",
        },
        props.style,
      ]}
    />
  );
}