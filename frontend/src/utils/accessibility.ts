// ARIA role constants
export const ARIA_ROLES = {
    ALERT: 'alert',
    ALERTDIALOG: 'alertdialog',
    BUTTON: 'button',
    CHECKBOX: 'checkbox',
    DIALOG: 'dialog',
    GRID: 'grid',
    LINK: 'link',
    LISTBOX: 'listbox',
    MENU: 'menu',
    MENUITEM: 'menuitem',
    MENUITEMCHECKBOX: 'menuitemcheckbox',
    MENUITEMRADIO: 'menuitemradio',
    OPTION: 'option',
    PROGRESSBAR: 'progressbar',
    RADIO: 'radio',
    RADIOGROUP: 'radiogroup',
    SCROLLBAR: 'scrollbar',
    SEARCHBOX: 'searchbox',
    SLIDER: 'slider',
    SPINBUTTON: 'spinbutton',
    STATUS: 'status',
    TAB: 'tab',
    TABLIST: 'tablist',
    TABPANEL: 'tabpanel',
    TEXTBOX: 'textbox',
    TIMER: 'timer',
    TOOLTIP: 'tooltip',
    TREE: 'tree',
    TREEGRID: 'treegrid',
    TREEGRIDITEM: 'treegriditem',
    TREEITEM: 'treeitem',
} as const;

// ARIA state constants
export const ARIA_STATES = {
    EXPANDED: 'aria-expanded',
    HIDDEN: 'aria-hidden',
    SELECTED: 'aria-selected',
    CHECKED: 'aria-checked',
    DISABLED: 'aria-disabled',
    INVALID: 'aria-invalid',
    REQUIRED: 'aria-required',
    BUSY: 'aria-busy',
    CURRENT: 'aria-current',
    PRESSED: 'aria-pressed',
    SORT: 'aria-sort',
    VALUEMIN: 'aria-valuemin',
    VALUEMAX: 'aria-valuemax',
    VALUENOW: 'aria-valuenow',
    VALUETEXT: 'aria-valuetext',
} as const;

// Focus management
export const focusableElements = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
    '[contenteditable="true"]',
];

export function getFocusableElements(container: HTMLElement): HTMLElement[] {
    return Array.from(
        container.querySelectorAll<HTMLElement>(focusableElements.join(','))
    );
}

export function trapFocus(container: HTMLElement): () => void {
    const focusableElements = getFocusableElements(container);
    const firstFocusableElement = focusableElements[0];
    const lastFocusableElement = focusableElements[focusableElements.length - 1];

    function handleKeyDown(event: KeyboardEvent) {
        if (event.key !== 'Tab') return;

        if (event.shiftKey) {
            if (document.activeElement === firstFocusableElement) {
                event.preventDefault();
                lastFocusableElement?.focus();
            }
        } else {
            if (document.activeElement === lastFocusableElement) {
                event.preventDefault();
                firstFocusableElement?.focus();
            }
        }
    }

    container.addEventListener('keydown', handleKeyDown);
    return () => container.removeEventListener('keydown', handleKeyDown);
}

// Screen reader announcements
export function announceToScreenReader(message: string, politeness: 'polite' | 'assertive' = 'polite'): void {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', politeness);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    document.body.appendChild(announcement);
    setTimeout(() => announcement.remove(), 1000);
}

// Keyboard navigation helpers
export function handleKeyPress(
    event: React.KeyboardEvent,
    callback: () => void,
    key: string = 'Enter'
): void {
    if (event.key === key) {
        event.preventDefault();
        callback();
    }
}

// ARIA label helpers
export function getAriaLabel(
    label: string,
    required?: boolean,
    error?: string
): string {
    let ariaLabel = label;
    if (required) ariaLabel += ' (required)';
    if (error) ariaLabel += ` - ${error}`;
    return ariaLabel;
}

// Form field accessibility
export interface AccessibilityProps {
    id: string;
    label: string;
    required?: boolean;
    error?: string;
    description?: string;
}

export function getAccessibilityProps({
    id,
    label,
    required,
    error,
    description,
}: AccessibilityProps) {
    return {
        id,
        'aria-label': getAriaLabel(label, required, error),
        'aria-required': required,
        'aria-invalid': !!error,
        'aria-describedby': description ? `${id}-description` : undefined,
        'aria-errormessage': error ? `${id}-error` : undefined,
    };
} 