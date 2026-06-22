import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../api/firebaseConfig';
import type { Dispatch } from '@reduxjs/toolkit';

interface AppSettingsState {
    classes: string[];
    books: string[];
    libraryCategories: string[];
    loading: boolean;
}

const initialState: AppSettingsState = {
    classes: [],
    books: [],
    libraryCategories: ['All', 'Notes', 'PDF', 'Books', 'Videos', 'PPT'], // Default fallback
    loading: true,
};

const appSettingsSlice = createSlice({
    name: 'appSettings',
    initialState,
    reducers: {
        setClasses(state, action: PayloadAction<string[]>) {
            state.classes = action.payload;
        },
        setBooks(state, action: PayloadAction<string[]>) {
            state.books = action.payload;
        },
        setLibraryCategories(state, action: PayloadAction<string[]>) {
            state.libraryCategories = action.payload;
        },
        setLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        }
    }
});

export const { setClasses, setBooks, setLibraryCategories, setLoading } = appSettingsSlice.actions;
export default appSettingsSlice.reducer;

export const initAppSettingsListener = (dispatch: Dispatch) => {
    const unsubClasses = onSnapshot(doc(db, 'appSettings', 'classes'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().list) && docSnap.data().list.length > 0) {
            dispatch(setClasses(docSnap.data().list));
        }
    });

    const unsubBooks = onSnapshot(doc(db, 'appSettings', 'books'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().list) && docSnap.data().list.length > 0) {
            dispatch(setBooks(docSnap.data().list));
        }
    });

    const unsubLibCats = onSnapshot(doc(db, 'appSettings', 'libraryCategories'), (docSnap) => {
        if (docSnap.exists() && Array.isArray(docSnap.data().list) && docSnap.data().list.length > 0) {
            dispatch(setLibraryCategories(['All', ...docSnap.data().list]));
        } else {
             // Fallback
             dispatch(setLibraryCategories(['All', 'Notes', 'PDF', 'Books', 'Videos', 'PPT']));
        }
        dispatch(setLoading(false));
    });

    return () => {
        unsubClasses();
        unsubBooks();
        unsubLibCats();
    };
};
