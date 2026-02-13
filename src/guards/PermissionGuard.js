import React from "react";
import { View, Text } from "react-native";
import { usePermission } from "../hooks/usePermission";
import { ActivityIndicator } from "react-native";

export default function PermissionGuard({ permission, children }) {
    const allowed = usePermission(permission);
    console.log("allowed ", allowed)

    if (allowed === null) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <ActivityIndicator size="large" />
            </View>
        );
    }

    if (!allowed) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text style={{
                    fontSize: 16,
                    fontWeight: "600",
                    color: global.colors.secondary,
                    marginBottom: 8,
                }}>Upgrade Your Plan</Text>
                <Text style={{
                    fontSize: 13,
                    color: global.colors.textSecondary,
                    textAlign: "center",
                    marginBottom: 20,
                }}>
                    Unlock this feature by upgrading your plan.
                </Text>
            </View>
        );
    }

    return children;
}
