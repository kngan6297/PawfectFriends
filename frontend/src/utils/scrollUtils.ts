/**
 * Utility functions for scroll behavior
 */

/**
 * Scroll to the top of the page with smooth behavior
 */
export const scrollToTop = (): void => {
    window.scrollTo({
        top: 0,
        left: 0,
        behavior: "smooth",
    });
};

/**
 * Scroll to a specific element with smooth behavior
 * @param element - The element to scroll to
 * @param block - The vertical alignment within the viewport
 */
export const scrollToElement = (
    element: HTMLElement,
    block: ScrollLogicalPosition = "start"
): void => {
    element.scrollIntoView({
        behavior: "smooth",
        block,
    });
};

/**
 * Scroll to top after a short delay to ensure DOM updates are complete
 * Useful for step transitions where content might be changing
 * @param delay - Delay in milliseconds before scrolling
 */
export const scrollToTopDelayed = (delay: number = 100): void => {
    setTimeout(() => {
        scrollToTop();
    }, delay);
};
