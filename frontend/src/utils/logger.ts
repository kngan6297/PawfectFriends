type Level = 'silent' | 'error' | 'warn' | 'info' | 'debug';
const weight = { silent: 0, error: 1, warn: 2, info: 3, debug: 4 };
const LOG_LEVEL: Level = (import.meta.env.VITE_LOG_LEVEL as Level) || (import.meta.env.DEV ? 'debug' : 'warn');
const pass = (need: Level) => weight[need] <= weight[LOG_LEVEL];

export const log = { 
  debug: (tag: string, ...a: any[]) => pass('debug') && console.debug(`[${tag}]`, ...a), 
  info: (tag: string, ...a: any[]) => pass('info') && console.info(`[${tag}]`, ...a), 
  warn: (tag: string, ...a: any[]) => pass('warn') && console.warn(`[${tag}]`, ...a), 
  error: (tag: string, ...a: any[]) => pass('error') && console.error(`[${tag}]`, ...a),
};
