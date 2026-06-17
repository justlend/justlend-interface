export const getStickyBackground = scrollTop => {
  const SCROLL_START = 415;
  const SCROLL_END = 475;

  const INITIAL_BACKGROUND = 'linear-gradient(180deg, #dcf4e3, #f5f5f5)';
  const FINAL_BACKGROUND = '#f5f5f5';

  if (scrollTop < SCROLL_START) {
    return INITIAL_BACKGROUND;
  } else if (scrollTop < SCROLL_END) {
    const transitionDistance = SCROLL_END - SCROLL_START;
    const distance = scrollTop - SCROLL_START;
    const ratio = distance / transitionDistance;

    if (ratio < 0.5) {
      return 'linear-gradient(180deg, #eaf2ee, #f5f5f5)';
    } else {
      return 'linear-gradient(180deg, #f0f3f2, #f5f5f5)';
    }

    
  } else {
    return FINAL_BACKGROUND;
  }
};
