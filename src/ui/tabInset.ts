/**
 * Space the floating tab bar takes at the bottom of tab screens. The tabs layout provides it; screens
 * add it to their bottom padding so the last card is never hidden behind the bar. Zero elsewhere.
 */
import { createContext, useContext } from 'react';

export const TabBarInsetContext = createContext(0);

export const useTabBarInset = (): number => useContext(TabBarInsetContext);
