import { DailyStats, ActivityData, NutritionData, BodyProfile } from '../types';

import { API_BASE } from "./apiBase";

const getAuthToken = () => {
    const authRaw = localStorage.getItem("genfit_auth_user");
    if (!authRaw) return null;
    try {
        const { token } = JSON.parse(authRaw);
        return token;
    } catch (e) {
        return null;
    }
};

export const fetchUserData = async () => {
    const token = getAuthToken();
    if (!token) throw new Error("No token found");

    const res = await fetch(`${API_BASE}/api/sync/data`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!res.ok) throw new Error("Failed to sync data");
    return res.json(); // returns Full User Document
};

export const syncUserData = async (data: { activities?: ActivityData[], nutrition?: NutritionData[], stats?: DailyStats, bodyProfile?: BodyProfile | null }) => {
    const token = getAuthToken();
    if (!token) return; // Don't throw, just silently skip if logged out

    // Note: backend reads 'blueprint' key, so we remap bodyProfile -> blueprint
    const { bodyProfile, ...rest } = data;
    const payload = { ...rest, ...(bodyProfile !== undefined ? { blueprint: bodyProfile } : {}) };

    await fetch(`${API_BASE}/api/sync/data`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    });
};
