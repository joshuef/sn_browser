// @flow
import { remote } from 'electron';
import { TYPES } from 'actions/tabs_actions';

import initialAppState from './initialAppState.json';

const initialState = initialAppState.tabs;

const getActiveTab = ( state ) => state.find( tab => tab.isActiveTab );
const getActiveTabIndex = ( state ) => state.findIndex( tab => tab.isActiveTab );

const deactivateOldActiveTab = ( state ) =>
{
    const activeTabIndex = getActiveTabIndex( state );

    if ( activeTabIndex > -1 )
    {
        const oldActiveTab = getActiveTab( state );
        const updatedOldTab = { ...oldActiveTab, isActiveTab: false };

        const updatedState = [...state];
        updatedState[activeTabIndex] = updatedOldTab;
        return updatedState;
    }

    return state;
};

/**
 * set active tab to a given index
 * @param       { Int } index index to set as activeTabIndex
 * @param       { Array } state the state array of tabs
 * @constructor
 */
const setActiveTab = ( state, payload ) =>
{
    const index = payload.index;
    const newActiveTab = state[index];
    let updatedState = [...state];

    updatedState = deactivateOldActiveTab( state );

    updatedState[index] = { ...newActiveTab, isActiveTab: true, isClosed: false };

    return updatedState;
};


const updateTabHistory = ( tabToMerge, url ) =>
{
    const updatedTab = { ...tabToMerge };
    if ( url && url !== tabToMerge.url )
    {
        if ( updatedTab.history )
        {
            updatedTab.history.push( url );
        }
        else
        {
            updatedTab.history = [url];
        }
    }
    return updatedTab;
};


const addTab = ( state, tab ) =>
{
    const currentWindowId = remote ? remote.getCurrentWindow().id : 1;
    const newTab = { ...tab, windowId: currentWindowId };

    let newState = [...state];

    if ( newTab.isActiveTab )
    {
        newState = deactivateOldActiveTab( newState );
    }

    newState.push( newTab );


    return newState;
};

/**
 * Set a tab as closed. If it is active, deactivate and and set a new active tab
 * @param { array } state
 * @param { object } payload
 */
const setTabAsClosed = ( state, payload ) =>
{
    const index = payload.index;

    const tabToMerge = state[index];
    const updatedTab = {
        ...tabToMerge, isActiveTab : false, index, isClosed    : true, closedTime  : new Date()
    };
    let updatedState = [...state];
    updatedState[index] = updatedTab;

    if ( tabToMerge.isActiveTab )
    {
        // TODO: Filter tabs for isClosed and get nearest index that is not closed
        let newActiveTabIndex = index - 1;
        const newActiveTab = state[newActiveTabIndex];

        if ( !newActiveTab )
        {
            newActiveTabIndex = index + 1;
        }

        updatedState = setActiveTab( updatedState, { index: newActiveTabIndex } );
    }

    return updatedState;
};

const closeActiveTab = ( state ) =>
{
    const activeTabIndex = getActiveTabIndex( state );

    return setTabAsClosed( state, { index: activeTabIndex } );
};


const reopenTab = ( state ) =>
{
    let { lastTab, lastTabIndex } = getLastClosedTab( state );

    lastTab = { ...lastTab, isClosed: false, closedTime: null };
    const updatedState = [...state];

    updatedState[lastTabIndex] = lastTab;

    return updatedState;
};

export function getLastClosedTab( state )
{
    let i = 0;
    const tabAndIndex = {
        lastTabIndex : 0
    };

    const tab = state.reduce( ( prev, current ) =>
    {
        let tab;
        if ( !prev.closedTime || current.closedTime > prev.closedTime )
        {
            tabAndIndex.lastTabIndex = i;
            tab = current;
        }
        else
        {
            tab = prev;
        }

        i += 1;
        return tab;
    }, state[0] );

    tabAndIndex.lastTab = tab;

    return tabAndIndex;
}


const updateActiveTab = ( state, payload ) =>
{
    const index = getActiveTabIndex( state );

    if ( index < 0 )
    {
        return state;
    }

    const tabToMerge = state[index];

    let updatedTab = { ...tabToMerge, ...payload };

    const url = payload.url;

    updatedTab = updateTabHistory( updatedTab, url );

    const updatedState = [...state];

    updatedState[index] = updatedTab;
    return updatedState;
};


const updateTab = ( state, payload ) =>
{
    const index = payload.index;

    if ( index < 0 )
    {
        return state;
    }

    const tabToMerge = state[index];

    let updatedTab = { ...tabToMerge, ...payload };

    const url = payload.url;

    updatedTab = updateTabHistory( updatedTab, url );

    const updatedState = [...state];

    updatedState[index] = updatedTab;

    return updatedState;
};


/**
 * Tabs reducer. Should handle all tab states, including window/tab id and the individual tab history
 * @param  { array } state  array of tabs
 * @param  { object } action action Object
 * @return { array }        updatd state object
 */
export default function tabs( state: array = initialState, action )
{
    const payload = action.payload;

    if ( action.error )
    {
        console.log( 'ERROR IN ACTION', action.error );
        return state;
    }

    switch ( action.type )
    {
        case TYPES.ADD_TAB :
        {
            return addTab( state, payload );
        }
        case TYPES.SET_ACTIVE_TAB :
        {
            return setActiveTab( state, payload );
        }
        case TYPES.CLOSE_TAB :
        {
            return setTabAsClosed( state, payload );
        }
        case TYPES.CLOSE_ACTIVE_TAB :
        {
            return closeActiveTab( state );
        }
        case TYPES.REOPEN_TAB :
        {
            return reopenTab( state );
        }
        case TYPES.UPDATE_ACTIVE_TAB :
        {
            return updateActiveTab( state, payload );
        }
        case TYPES.UPDATE_TAB :
        {
            return updateTab( state, payload );
        }
        default:
            return state;
    }
}
