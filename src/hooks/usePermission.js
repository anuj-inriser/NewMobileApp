import { useAuth } from "../context/AuthContext";

export const usePermission = (permission) => {
    const { permissions, permissionsLoading } = useAuth();
    if (permissionsLoading) {
        return null;
    }
    if (!permissions || permissions.length === 0) {
        return false;
    }

    return permissions.includes(permission);
};