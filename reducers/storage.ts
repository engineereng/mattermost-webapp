// Copyright (c) 2015-present Mattermost, Inc. All Rights Reserved.
// See LICENSE.txt for license information.

import {combineReducers} from 'redux';

import {General} from 'mattermost-redux/constants';

import {Dictionary} from 'mattermost-redux/types/utilities';
import type {GenericAction} from 'mattermost-redux/types/actions';

import {StorageTypes} from 'utils/constants';

function storage(state: Dictionary<any> = {}, action: GenericAction) {
    switch (action.type) {
    case StorageTypes.SET_ITEM: {
        if (!state[action.data.prefix + action.data.name] ||
            !state[action.data.prefix + action.data.name].timestamp ||
            state[action.data.prefix + action.data.name].timestamp < action.data.timestamp
        ) {
            const nextState = {...state};
            nextState[action.data.prefix + action.data.name] = {
                timestamp: action.data.timestamp,
                value: action.data.value,
            };
            return nextState;
        }
        return state;
    }
    case StorageTypes.REMOVE_ITEM: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data.prefix + action.data.name);
        return nextState;
    }
    case StorageTypes.SET_GLOBAL_ITEM: {
        if (!state[action.data.name] ||
            !state[action.data.name].timestamp ||
            state[action.data.name].timestamp < action.data.timestamp
        ) {
            const nextState = {...state};
            nextState[action.data.name] = {
                timestamp: action.data.timestamp,
                value: action.data.value,
            };
            return nextState;
        }
        return state;
    }
    case StorageTypes.REMOVE_GLOBAL_ITEM: {
        const nextState = {...state};
        Reflect.deleteProperty(nextState, action.data.name);
        return nextState;
    }
    case StorageTypes.CLEAR: {
        const cleanState: Dictionary<any> = {};
        if (action.data && action.data.exclude && action.data.exclude.forEach) {
            action.data.exclude.forEach((excluded: any) => {
                if (state[excluded]) {
                    cleanState[excluded] = state[excluded];
                }
            });
        }
        return cleanState;
    }
    case StorageTypes.ACTION_ON_GLOBAL_ITEMS_WITH_PREFIX: {
        const nextState = {...state};
        let changed = false;

        for (const key of Object.keys(nextState)) {
            if (!key.startsWith(action.data.prefix)) {
                continue;
            }

            const value = nextState[key].value;
            const nextValue = action.data.action(key, value);
            if (value === nextValue) {
                continue;
            }

            nextState[key] = {
                timestamp: new Date(),
                value: action.data.action(key, state[key].value),
            };
            changed = true;
        }

        return changed ? nextState : state;
    }
    case StorageTypes.STORAGE_REHYDRATE: {
        return {...state, ...action.data};
    }
    default:
        return state;
    }
}

function initialized(state = false, action: GenericAction) {
    switch (action.type) {
    case General.STORE_REHYDRATION_COMPLETE:
        return state || action.complete;

    default:
        return state;
    }
}

export default combineReducers({
    storage,
    initialized,
});
