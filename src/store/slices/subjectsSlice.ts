import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';
import type { Dispatch } from '@reduxjs/toolkit';

export interface Subject {
    id: string;
    name: string;
}

interface SubjectsState {
    list: Subject[];
    status: 'idle' | 'loading' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: SubjectsState = {
    list: [],
    status: 'idle',
    error: null,
};

const subjectsSlice = createSlice({
    name: 'subjects',
    initialState,
    reducers: {
        setSubjects: (state, action: PayloadAction<Subject[]>) => {
            state.list = action.payload;
            state.status = 'succeeded';
        },
        setStatus: (state, action: PayloadAction<'idle' | 'loading' | 'succeeded' | 'failed'>) => {
            state.status = action.payload;
        },
        setError: (state, action: PayloadAction<string>) => {
            state.error = action.payload;
            state.status = 'failed';
        }
    }
});

export const { setSubjects, setStatus, setError } = subjectsSlice.actions;
export default subjectsSlice.reducer;

export const initSubjectsListener = (dispatch: Dispatch) => {
    dispatch(setStatus('loading'));
    const q = query(collection(db, 'subjects'));
    
    return onSnapshot(
        q,
        (snapshot) => {
            const subjectsList: Subject[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                subjectsList.push({
                    id: doc.id,
                    name: data.name || data.subject || doc.id,
                });
            });
            dispatch(setSubjects(subjectsList));
        },
        (error) => {
            console.error('Subjects fetch error:', error);
            dispatch(setError(error.message));
        }
    );
};
