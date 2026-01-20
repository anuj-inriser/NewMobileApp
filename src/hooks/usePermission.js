import { useAuth } from "../context/AuthContext";

export const usePermission = (permission) => {
    const { permissions } = useAuth();

    if (!permissions || permissions.length === 0) {
        return false;
    }

    return permissions.includes(permission);
};
