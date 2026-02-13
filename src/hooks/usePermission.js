import { useAuth } from "../context/AuthContext";

export const usePermission = (permission) => {
    const { permissions, permissionsReady } = useAuth();

    // still loading
    if (!permissionsReady || permissions === null) {
        return null;
    }

    // loaded but empty
    if (permissions.length === 0) {
        return false;
    }

    return permissions.includes(permission);
};