import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { db } from '../../api/firebaseConfig';
import { collection, query, where, getDocs, orderBy, or, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { enqueueAction } from './syncSlice';
import { processSyncQueue } from '../syncManager';

// ── Types ──────────────────────────────────────────────
export interface BookEntry {
    name: string;
    totalMarks: string;
    obtainedMarks: string;
}

export interface ExamEntry {
    id: string;
    title: string;
    date: string;
    category: string;
    rollNo?: string;
    studentName?: string;
    studentEmail?: string;
    studentClass?: string;
    books?: BookEntry[];
    bookName?: string;
    totalMarks?: string;
    obtainedMarks?: string;
    status?: string;
    description: string;
}

interface ResultsState {
    list: ExamEntry[];
    isLoading: boolean;
    error: string | null;
}

const initialState: ResultsState = {
    list: [],
    isLoading: false,
    error: null,
};

// ── Thunks ─────────────────────────────────────────────
export const fetchResults = createAsyncThunk(
    'results/fetch',
    async (params: { userRollNo: string | null; userEmail: string | null; studentName: string | null; studentClass: string | null }, { rejectWithValue }) => {
        try {
            const { userRollNo, userEmail, studentName, studentClass } = params;

            if (!userRollNo && !userEmail && (!studentName || !studentClass)) {
                return [];
            }

            const examsRef = collection(db, 'exams');

            // Build OR conditions using every available identifier.
            // Exams saved from the dashboard store studentEmail in mixed-case academy format
            // (e.g. STD-9002@TheSeeksAcademy.edu.pk) while Firebase Auth gives lowercase.
            // We include both variants so results are found regardless of storage case.
            const conditions: any[] = [];

            if (userRollNo) {
                conditions.push(where('rollNo', '==', userRollNo));
            }
            if (userEmail) {
                const emailLower = userEmail.toLowerCase();
                conditions.push(where('studentEmail', '==', emailLower));

                // Also try the academy mixed-case format: STD-9002@TheSeeksAcademy.edu.pk
                const parts = emailLower.split('@');
                const emailMixed = parts.length === 2
                    ? `${parts[0].toUpperCase()}@TheSeeksAcademy.edu.pk`
                    : emailLower;
                if (emailMixed !== emailLower) {
                    conditions.push(where('studentEmail', '==', emailMixed));
                }
            }
            if (studentName) {
                conditions.push(where('studentName', '==', studentName));
            }

            if (conditions.length === 0) return [];

            const q = conditions.length === 1
                ? query(examsRef, conditions[0])
                : query(examsRef, or(...conditions));

            const snapshot = await getDocs(q);

            // De-duplicate (or() may return the same doc from multiple clauses)
            const seen = new Set<string>();
            const results: ExamEntry[] = [];
            snapshot.forEach((d) => {
                if (!seen.has(d.id)) {
                    seen.add(d.id);
                    const data = d.data() as ExamEntry;

                    // If studentClass is known, also filter to this student's class
                    // to avoid picking up homonymous students in other classes
                    if (studentClass && data.studentClass && data.studentClass !== studentClass) {
                        // Only reject if we matched by name (not by rollNo or email)
                        const matchedByRollNo = userRollNo && data.rollNo === userRollNo;
                        const matchedByEmail  = userEmail  && data.studentEmail === userEmail;
                        if (!matchedByRollNo && !matchedByEmail) return;
                    }

                    results.push({ ...data, id: d.id });
                }
            });

            // Sort by date descending
            results.sort((a, b) => {
                const dA = new Date(a.date).getTime() || 0;
                const dB = new Date(b.date).getTime() || 0;
                return dB - dA;
            });

            return results;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch results');
        }
    }
);

export const saveResult = createAsyncThunk(
    'results/save',
    async (payload: { examData: ExamEntry }, { dispatch, rejectWithValue }) => {
        try {
            const { examData } = payload;
            
            // Generate ID if missing (simplistic approach for offline queue)
            const id = examData.id || `exam_${Date.now()}`;
            const finalData = { ...examData, id };

            // Optimistic update locally
            dispatch(resultsSlice.actions.addOrUpdateResult(finalData));

            // Queue for offline sync
            dispatch(enqueueAction({
                id: `save_exam_${id}_${Date.now()}`,
                actionType: 'WRITE_RESULT',
                payload: { resultId: id, payload: finalData },
                timestamp: Date.now(),
            }));

            // @ts-ignore
            dispatch(processSyncQueue());

            return finalData;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

export const deleteResult = createAsyncThunk(
    'results/delete',
    async (payload: { id: string }, { dispatch, rejectWithValue }) => {
        try {
            const { id } = payload;
            
            // Optimistic update locally
            dispatch(resultsSlice.actions.removeResult(id));

            // Queue for offline sync
            dispatch(enqueueAction({
                id: `delete_exam_${id}_${Date.now()}`,
                actionType: 'DELETE_RESULT',
                payload: { resultId: id },
                timestamp: Date.now(),
            }));

            // @ts-ignore
            dispatch(processSyncQueue());

            return id;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// ── Slice ──────────────────────────────────────────────
const resultsSlice = createSlice({
    name: 'results',
    initialState,
    reducers: {
        clearResults(state) {
            state.list = [];
            state.error = null;
        },
        addOrUpdateResult(state, action) {
            const index = state.list.findIndex(r => r.id === action.payload.id);
            if (index !== -1) {
                state.list[index] = action.payload;
            } else {
                state.list.unshift(action.payload); // Add to top
            }
        },
        removeResult(state, action) {
            state.list = state.list.filter(r => r.id !== action.payload);
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchResults.pending, (state) => {
                state.isLoading = true;
                state.error = null;
            })
            .addCase(fetchResults.fulfilled, (state, action) => {
                state.list = action.payload;
                state.isLoading = false;
            })
            .addCase(fetchResults.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearResults, addOrUpdateResult, removeResult } = resultsSlice.actions;
export default resultsSlice.reducer;
