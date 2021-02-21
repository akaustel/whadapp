import { createReducer, on } from '@ngrx/store';
import { reset, selectIdentity, setIdentities } from './wish.actions';
import { Identity } from '../app/wish/wish.service';

export interface WishState {
    identity: Identity;
    identities: Identity[];
}

export const initialState: WishState = {
    identities: [],
    identity: null,
};

const reducer = createReducer(
    initialState,
    on(setIdentities, (state, { identities }) => ({ ...state, identities })),
    on(selectIdentity, (state, { identity }) => ({ ...state, identity })),
    on(reset, (state) => ({ ...state, identities: [] })),
);

export function wishReducer(state, action) {
    return reducer(state, action);
}
