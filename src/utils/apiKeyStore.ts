
const GLOBAL_KEY = 'user_gemini_api_key';

export const apiKeyStore = {
    // Get key for specific user
    get: (userId?: string): string | null => {
        if (!userId) return localStorage.getItem(GLOBAL_KEY);

        // Privacy: Use namespaced key
        const userSpecificKey = localStorage.getItem(`user_${userId}_api_key`);

        // Migration: If user has no key but global exists (from before), claim it
        if (!userSpecificKey) {
            const globalKey = localStorage.getItem(GLOBAL_KEY);
            if (globalKey) {
                localStorage.setItem(`user_${userId}_api_key`, globalKey);
                // Optional: localStorage.removeItem(GLOBAL_KEY); // Clean up global? Maybe safer to leave for now.
                return globalKey;
            }
        }

        return userSpecificKey;
    },

    set: (key: string, userId?: string) => {
        if (!userId) {
            // Fallback to global if no user (shouldn't happen in auth'd app)
            if (!key) localStorage.removeItem(GLOBAL_KEY);
            else localStorage.setItem(GLOBAL_KEY, key.trim());
            return;
        }

        const storageKey = `user_${userId}_api_key`;
        if (!key) {
            localStorage.removeItem(storageKey);
        } else {
            localStorage.setItem(storageKey, key.trim());
        }
    },

    clear: (userId?: string) => {
        if (userId) {
            localStorage.removeItem(`user_${userId}_api_key`);
        } else {
            localStorage.removeItem(GLOBAL_KEY);
        }
    },

    // Helper to resolve key hierarchy: User Key -> Env Key
    getEffectiveKey: (userId?: string): string | null => {
        // 1. Check User LocalStorage (Priority 1)
        const userKey = apiKeyStore.get(userId);
        if (userKey) return userKey;

        // 2. Check Environment Variable (Priority 2 - Dev/Fallback)
        return import.meta.env.VITE_GEMINI_API_KEY || import.meta.env.VITE_OPENAI_API_KEY || null;
    }
};
