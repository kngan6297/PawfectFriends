import DOMPurify from 'dompurify';
import type { Directive } from 'vue';

export const vSafeHtml: Directive<HTMLElement, string> = {
    mounted(el, binding) {
        el.innerHTML = DOMPurify.sanitize(binding.value ?? '', {
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
            ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'img', 'a'],
        });

        // Harden links: add security attributes
        for (const a of el.querySelectorAll('a')) {
            a.setAttribute('rel', 'noopener noreferrer');
            if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
        }
    },
    updated(el, binding) {
        el.innerHTML = DOMPurify.sanitize(binding.value ?? '', {
            ALLOWED_ATTR: ['href', 'src', 'alt', 'title', 'target', 'rel', 'class'],
            ALLOWED_TAGS: ['div', 'span', 'p', 'br', 'b', 'i', 'em', 'strong', 'ul', 'ol', 'li', 'img', 'a'],
        });

        // Harden links: add security attributes
        for (const a of el.querySelectorAll('a')) {
            a.setAttribute('rel', 'noopener noreferrer');
            if (!a.getAttribute('target')) a.setAttribute('target', '_blank');
        }
    }
};
