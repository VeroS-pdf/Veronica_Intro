/**
 * useBrowserNavigation: the "brain" of the fake browser.
 *
 * It remembers:
 *  - whether the visitor has clicked the welcome text yet (`entered`),
 *  - which tab is showing (`currentTabId`),
 *  - a back/forward history, just like a real browser.
 *
 * Components only call the returned functions; they never touch the state directly.
 */
import { useCallback, useReducer } from 'react';
import { HOME_TAB_ID } from '../tabs';
import type { TabId } from '../types';

interface NavigationState {
  entered: boolean;
  /** Every page visited, oldest first. */
  history: TabId[];
  /** Index into `history` of the page currently on screen. */
  cursor: number;
}

type NavigationAction =
  | { type: 'enter' }
  | { type: 'navigate'; tab: TabId }
  | { type: 'back' }
  | { type: 'forward' };

const INITIAL_STATE: NavigationState = {
  entered: false,
  history: [HOME_TAB_ID],
  cursor: 0,
};

/** Pure function describing how each action changes the navigation state. */
function reducer(state: NavigationState, action: NavigationAction): NavigationState {
  switch (action.type) {
    case 'enter':
      return state.entered ? state : { ...state, entered: true };

    case 'navigate': {
      if (!state.entered || state.history[state.cursor] === action.tab) return state;
      // Visiting a new page throws away any "forward" history, like a real browser.
      const history = [...state.history.slice(0, state.cursor + 1), action.tab];
      return { ...state, history, cursor: history.length - 1 };
    }

    case 'back':
      return state.cursor > 0 ? { ...state, cursor: state.cursor - 1 } : state;

    case 'forward':
      return state.cursor < state.history.length - 1 ? { ...state, cursor: state.cursor + 1 } : state;
  }
}

export function useBrowserNavigation() {
  const [state, dispatch] = useReducer(reducer, INITIAL_STATE);

  const enter = useCallback(() => dispatch({ type: 'enter' }), []);
  const navigate = useCallback((tab: TabId) => dispatch({ type: 'navigate', tab }), []);
  const back = useCallback(() => dispatch({ type: 'back' }), []);
  const forward = useCallback(() => dispatch({ type: 'forward' }), []);

  return {
    /** `true` once the welcome text has been clicked. */
    entered: state.entered,
    /** Id of the tab whose page is on screen. */
    currentTabId: state.history[state.cursor],
    canGoBack: state.entered && state.cursor > 0,
    canGoForward: state.entered && state.cursor < state.history.length - 1,
    enter,
    navigate,
    back,
    forward,
  };
}
