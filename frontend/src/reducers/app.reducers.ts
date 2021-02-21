import { createReducer, on } from '@ngrx/store';
import { setState, State } from './app.actions';

export const initialState: State = 'init';

const reducer = createReducer(
    initialState,
    on(setState, (current, { state }) => state),
);

export function appReducer(state, action) {
    return reducer(state, action);
}
