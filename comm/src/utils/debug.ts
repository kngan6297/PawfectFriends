// Debug utility for conditional logging
const isDevelopment = import.meta.env.DEV;
const isDebugEnabled = isDevelopment || localStorage.getItem('debug') === 'true';

export const debug = {
    log: (...args: any[]) => {
        if (isDebugEnabled) {
            console.log(...args);
        }
    },

    error: (...args: any[]) => {
        // Always log errors
        console.error(...args);
    },

    warn: (...args: any[]) => {
        // Always log warnings
        console.warn(...args);
    },

    info: (...args: any[]) => {
        if (isDebugEnabled) {
            console.info(...args);
        }
    }
};

export default debug;
