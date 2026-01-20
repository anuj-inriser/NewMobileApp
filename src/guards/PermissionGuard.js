import React from "react";
import { View, Text } from "react-native";
import { usePermission } from "../hooks/usePermission";

export default function PermissionGuard({ permission, children }) {
    const allowed = usePermission(permission);
    console.log("allowed ", allowed)

    if (!allowed) {
        return (
            <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
                <Text>Access denied</Text>
            </View>
        );
    }

    return children;
}
