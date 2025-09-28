/**
 * Calculates if an element is scrolled to the bottom
 * @param element Scrollable element
 * @param threshold Threshold in pixels (default: 100)
 * @returns True if element is near the bottom
 */
export function isScrolledToBottom(element: HTMLElement, threshold: number = 100): boolean {
  if (!element) return false;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight < threshold;
}

/**
 * Scrolls an element to the bottom smoothly
 * @param element Element to scroll
 * @param behavior Scroll behavior ('smooth' | 'instant')
 */
export function scrollToBottom(
  element: HTMLElement,
  behavior: ScrollBehavior = 'smooth',
): void {
  if (!element) return;
  
  element.scrollTo({
    top: element.scrollHeight,
    behavior,
  });
}

/**
 * Calculates scroll distance from bottom
 * @param element Scrollable element
 * @returns Distance from bottom in pixels
 */
export function getScrollDistanceFromBottom(element: HTMLElement): number {
  if (!element) return 0;
  
  const { scrollTop, scrollHeight, clientHeight } = element;
  return scrollHeight - scrollTop - clientHeight;
}

/**
 * Determines if scroll position should trigger auto-scroll
 * @param element Scrollable element
 * @param userScrolledUp Whether user manually scrolled up
 * @param threshold Auto-scroll threshold in pixels
 * @returns True if should auto-scroll
 */
export function shouldAutoScroll(
  element: HTMLElement,
  userScrolledUp: boolean,
  threshold: number = 100,
): boolean {
  if (!element || userScrolledUp) return false;
  return isScrolledToBottom(element, threshold);
}

/**
 * Creates a scroll position tracker for auto-scroll behavior
 * @param onScrollStateChange Callback when scroll state changes
 * @returns Scroll tracking utilities
 */
export function createScrollTracker(
  onScrollStateChange?: (isAtBottom: boolean, distance: number) => void,
) {
  let lastScrollTop = 0;
  let userScrolledUp = false;

  const handleScroll = (element: HTMLElement) => {
    const { scrollTop } = element;
    const isAtBottom = isScrolledToBottom(element);
    const distance = getScrollDistanceFromBottom(element);

    // Detect user scroll direction
    if (scrollTop < lastScrollTop) {
      userScrolledUp = true;
    } else if (isAtBottom) {
      userScrolledUp = false;
    }

    lastScrollTop = scrollTop;
    onScrollStateChange?.(isAtBottom, distance);
  };

  const resetUserScroll = () => {
    userScrolledUp = false;
  };

  return {
    handleScroll,
    resetUserScroll,
    getUserScrolledUp: () => userScrolledUp,
  };
}