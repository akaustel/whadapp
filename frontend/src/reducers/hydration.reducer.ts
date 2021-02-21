// hydration.reducer.ts
import { ActionReducer, INIT } from '@ngrx/store';
import { RootState } from 'src/app/app.module';

export const hydrationMetaReducer = (
    reducer: ActionReducer<RootState>
): ActionReducer<RootState> => {
    return (state, action) => {
        if (action.type === INIT) {
            const storageValue = localStorage.getItem('state');
            if (storageValue) {
                try {
                    return JSON.parse(storageValue);
                } catch {
                    localStorage.removeItem('state');
                }
            }
        }

        const nextState = reducer(state, action);

        const save = { ...nextState };

        delete save.state;

        localStorage.setItem('state', JSON.stringify(save));
        return nextState;
    };
};
