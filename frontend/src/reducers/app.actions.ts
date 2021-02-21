import { createAction, props } from '@ngrx/store';

export type State = 'init' | 'setup' | 'ready';

export const setState = createAction('[App] Set state', props<{ state: State }>());
