import { createReducer, on } from '@ngrx/store';
import { Message, setMessages, reset, addMessage } from './message.actions';

export const initialState: Message[] = [];

const reducer = createReducer(
    initialState,
    on(setMessages, (state, { messages }) => messages),
    on(addMessage, (state, { message }) => [...state, message]),
    on(reset, (state) => []),
);

export function messageReducer(state, action) {
    return reducer(state, action);
}
