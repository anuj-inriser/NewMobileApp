import React from "react";
import { StyleSheet, View } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import TradeOrderFormNative from "../components/TradeOrderFormNative";

export default function TradeOrderNativeScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const params = route.params || {};

  return (
    <SafeAreaView style={styles.container}>
      <TradeOrderFormNative
        symbol={params.symbol}
        token={params.token}
        name={params.name}
        price={params.price}
        quantity={params.quantity}
        target={params.target}
        stoploss={params.stoploss}
        exchange={params.exchange || "NSE"}
        onClose={() => navigation.goBack()}
        onOrderPlaced={() => navigation.navigate("App", { 
          screen: "MainTabs", 
          params: { screen: "OrdersScreen", params: { defaultTab: 2 } } 
        })}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: global.colors.background,
  },
});
