import { createAction, props } from '@ngrx/store';

export interface Message {
    /** Message body text */
    content: string;
    /** Wish User Id in hex format */
    from: string;
    /** Javascript timestamp */
    time: number;
}

export const setMessages = createAction('[Messages] Set messages', props<{ messages: Message[] }>());
export const addMessage = createAction('[Messages] Add message', props<{ message: Message }>());
export const reset = createAction('[Messages] Reset');
