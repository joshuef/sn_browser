import { combineReducers } from 'redux';

import { bookmarks } from './bookmarks';
import { notifications } from './notifications';
import { tabs } from './tabs';
import { remoteCalls } from './remoteCalls';
import { windows } from './windows';
import { logger } from '$Logger';

import { getExtensionReducers } from '$Extensions';

const additionalReducers = getExtensionReducers();

export function createRootReducer() {
  return combineReducers({
    bookmarks,
    notifications,
    remoteCalls,
    tabs,
    windows,
    ...additionalReducers
  });
}
