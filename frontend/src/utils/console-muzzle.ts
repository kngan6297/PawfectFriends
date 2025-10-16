// Console Muzzle - Suppress noisy logs immediately
// Import this file in main.tsx very early (dev or prod, it's up to you)

// Global flag to temporarily disable muzzle for debugging
// Set this to true in browser console to see all logs: (window as any).DISABLE_CONSOLE_MUZZLE = true

// Allow debugging logs to pass through
const ALLOW = [
  /🔍/,  // Magnifying glass emoji for debugging
  /🔄/,  // Arrows for state changes
  /✅/,  // Checkmark for success
  /❌/,  // X for errors
  /⚠️/,  // Warning emoji
  /🎉/,  // Party emoji for completion
  /🏁/,  // Flag for finish
  /🔌/,  // Plug for connections
  /📝/,  // Memo for data
  /📱/,  // Mobile phone

];

const MUTE = [
  /Auth loading, waiting for authentication/,
  /console-muzzle\.ts:\d+/  // Don't show muzzle logs
];

(['log', 'info', 'warn', 'error', 'debug'] as const).forEach(l => {
  const orig = console[l];
  console[l] = (...args: any[]) => {
    // Check if muzzle is disabled globally
    if ((window as any).DISABLE_CONSOLE_MUZZLE) {
      orig.apply(console, args);
      return;
    }

    const s = args.map(x => (typeof x === 'string' ? x : '')).join(' ');

    // First check if this log should be allowed (debug logs)
    if (ALLOW.some(rx => rx.test(s))) {
      orig.apply(console, args);
      return;
    }

    // Then check if it should be muted
    if (MUTE.some(rx => rx.test(s))) return;

    // Default: show the log
    orig.apply(console, args);
  };
});

console.log('[MUZZLE] Console muzzle activated - debugging logs allowed, noisy logs suppressed');
