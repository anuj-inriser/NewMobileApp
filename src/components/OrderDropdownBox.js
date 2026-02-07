import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import DropDownPicker from "react-native-dropdown-picker";

const OrderDropdownBox = ({
    id,
    openDropdown,
    setOpenDropdown,
    label = "",
    options = [],
    defaultValue = "",
    onChange,
    zIndex = 3000,
    zIndexInverse = 2000,
}) => {
    const [open, setOpen] = useState(false);
    const [value, setValue] = useState(defaultValue);

    const [items, setItems] = useState(
        options.map((o) => ({ label: o, value: o }))
    );

    useEffect(() => {
        if (openDropdown !== id) setOpen(false);
    }, [openDropdown]);

    return (
        <View style={[styles.container, { zIndex }]}>
            {/* Label box same height as input */}
            <View style={styles.labelBox}>
                <Text style={styles.labelText}>{label}</Text>
            </View>

            {/* Dropdown Box */}
            <View style={{ width: 150 }}>
                <DropDownPicker
                    open={open}
                    value={value}
                    items={items}

                    setOpen={(val) => {
                        setOpen(val);
                        if (val) setOpenDropdown(id);
                    }}
                    setValue={(cb) => {
                        const v = cb();
                        setValue(v);
                        onChange?.(v);
                    }}
                    setItems={setItems}

                    style={styles.dropdown}                  // ✔ Affects main visible box
                    containerStyle={styles.dropdownWrapper}  // ✔ Controls outer wrapper height
                    dropDownContainerStyle={styles.dropdownContainer} // ✔ Controls list height

                    listMode="SCROLLVIEW"
                    maxHeight={180}
                    zIndex={zIndex}
                    zIndexInverse={zIndexInverse}
                />

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginHorizontal: 20,
        marginVertical: 5,
    },

    labelBox: {
        backgroundColor: global.colors.surface,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 14,
        width: 150,
        marginRight: 10,
    },

    labelText: {
        color: global.colors.secondary,
        fontSize: 14,
        fontWeight: "600",
    },

    dropdownWrapper: {
        height: 32,       // ✔ Force wrapper height
    },

    dropdown: {
        height: 40,
        minHeight: 40,
        maxHeight: 40,
        borderRadius: 14,
        borderColor: global.colors.border,
        paddingVertical: 2,
        paddingHorizontal: 10,
    },

    dropdownContainer: {
        borderRadius: 14,
        borderColor: global.colors.border,
    },
});

export default OrderDropdownBox;