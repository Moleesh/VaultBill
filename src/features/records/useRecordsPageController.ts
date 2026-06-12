/** @format */

import { useRecordsPageActions } from './useRecordsPageActions';
import { useRecordsPageState } from './useRecordsPageState';

/** Combines the record page state and action hooks into one controller object. */
export const useRecordsPageController = () => {
    const state = useRecordsPageState();
    return { ...state, ...useRecordsPageActions(state) };
};
