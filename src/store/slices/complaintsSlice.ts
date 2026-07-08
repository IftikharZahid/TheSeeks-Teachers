import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { db, auth } from '../../api/firebaseConfig';
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    where,
    onSnapshot,
} from 'firebase/firestore';
import type { Dispatch } from '@reduxjs/toolkit';
import { enqueueAction } from './syncSlice';
import { processSyncQueue } from '../syncManager';

// ── Types ──────────────────────────────────────────────

export interface Complaint {
    id: string;
    subject: string;
    category: string;
    description: string;
    status: string;
    createdAt: any;
}

interface ComplaintsState {
    myComplaints: Complaint[];
    loading: boolean;
    submitting: boolean;
}

const initialState: ComplaintsState = {
    myComplaints: [],
    loading: true,
    submitting: false,
};

// ── Async Thunks ───────────────────────────────────────

export const submitComplaint = createAsyncThunk(
    'complaints/submitComplaint',
    async (payload: { subject: string; category: string; description: string }, { dispatch, rejectWithValue }) => {
        try {
            const user = auth.currentUser;
            const complaintData = {
                id: `complaint_${Date.now()}`,
                subject: payload.subject.trim(),
                category: payload.category,
                description: payload.description.trim(),
                userId: user?.uid || 'anonymous',
                userEmail: user?.email || 'anonymous',
                userName: user?.displayName || 'Anonymous User',
                status: 'Pending',
                createdAt: { seconds: Math.floor(Date.now() / 1000) }, // fake timestamp for local sorting
            };

            // Optimistic update locally
            dispatch(complaintsSlice.actions.addComplaintOptimistic(complaintData as any));

            // Queue for offline sync
            dispatch(enqueueAction({
                id: `submit_complaint_${Date.now()}`,
                actionType: 'SUBMIT_COMPLAINT',
                payload: complaintData,
                timestamp: Date.now(),
            }));

            // @ts-ignore
            dispatch(processSyncQueue());
            return complaintData;
        } catch (e: any) {
            return rejectWithValue(e.message);
        }
    }
);

// ── Slice ──────────────────────────────────────────────

const complaintsSlice = createSlice({
    name: 'complaints',
    initialState,
    reducers: {
        setMyComplaints(state, action: PayloadAction<Complaint[]>) {
            state.myComplaints = action.payload;
            state.loading = false;
        },
        setComplaintsLoading(state, action: PayloadAction<boolean>) {
            state.loading = action.payload;
        },
        clearComplaints() {
            return initialState;
        },
        addComplaintOptimistic(state, action: PayloadAction<Complaint>) {
            // Avoid duplicates if listener fires
            if (!state.myComplaints.find(c => c.id === action.payload.id)) {
                state.myComplaints.unshift(action.payload);
            }
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(submitComplaint.pending, (state) => {
                state.submitting = true;
            })
            .addCase(submitComplaint.fulfilled, (state) => {
                state.submitting = false;
            })
            .addCase(submitComplaint.rejected, (state) => {
                state.submitting = false;
            });
    },
});

export const { setMyComplaints, setComplaintsLoading, clearComplaints } = complaintsSlice.actions;
export default complaintsSlice.reducer;

// ── Firebase Listener (user-side) ─────────────────────

export const initMyComplaintsListener = (dispatch: Dispatch, uid: string) => {
    dispatch(setComplaintsLoading(true));

    const q = query(
        collection(db, 'complaints'),
        where('userId', '==', uid)
    );

    return onSnapshot(
        q,
        (snapshot) => {
            const list: Complaint[] = snapshot.docs.map((d) => ({
                id: d.id,
                ...d.data(),
            } as Complaint));
            // Sort client-side by newest first
            list.sort((a, b) => {
                const aTime = a.createdAt?.seconds || 0;
                const bTime = b.createdAt?.seconds || 0;
                return bTime - aTime;
            });
            dispatch(setMyComplaints(list));
        },
        (error) => {
            console.error('Error listening to user complaints:', error);
            dispatch(setComplaintsLoading(false));
        }
    );
};
