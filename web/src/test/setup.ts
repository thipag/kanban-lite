import "@testing-library/jest-dom";

if (!("matchMedia" in window)) {
  window.matchMedia = (() => {
    const matchMedia = (query: string) => ({
      matches: false,
      media: query,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false
    });
    return matchMedia;
  })();
}

if (!("ResizeObserver" in window)) {
  class ResizeObserver {
    observe() {
      return;
    }
    unobserve() {
      return;
    }
    disconnect() {
      return;
    }
  }
  (window as any).ResizeObserver = ResizeObserver;
}
