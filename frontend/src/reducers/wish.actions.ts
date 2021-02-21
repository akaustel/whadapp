import { createAction, props } from '@ngrx/store';
import { Identity } from '../app/wish/wish.service';

export const selectIdentity = createAction('[Wish] Select identity', props<{ identity: Identity }>());
export const setIdentities = createAction('[Wish] Set identities', props<{ identities: Identity[] }>());
export const removeIdentity = createAction('[Wish] Remove identity', props<{ uid: string }>());
export const reset = createAction('[Wish] Reset');
