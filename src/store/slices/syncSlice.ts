import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

export interface PendingAction {
    id: string;
    actionType: string;
    payload: any;
    timestamp: number;
    status: 'pending' | 'processing' | 'failed';
    error?: string;
    retryCount: number;
}

interface SyncState {
    pendingQueue: PendingAction[];
    isSyncing: boolean;
}

const initialState: SyncState = {
    pendingQueue: [],
    isSyncing: false,
};

const syncSlice = createSlice({
    name: 'sync',
    initialState,
    reducers: {
        enqueueAction(state, action: PayloadAction<Omit<PendingAction, 'status' | 'retryCount'>>) {
            state.pendingQueue.push({
                ...action.payload,
                status: 'pending',
                retryCount: 0,
            });
        },
        dequeueAction(state, action: PayloadAction<{ id: string }>) {
            state.pendingQueue = state.pendingQueue.filter(a => a.id !== action.payload.id);
        },
        updateActionStatus(state, action: PayloadAction<{ id: string; status: PendingAction['status']; error?: string }>) {
            const item = state.pendingQueue.find(a => a.id === action.payload.id);
            if (item) {
                item.status = action.payload.status;
                if (action.payload.error) item.error = action.payload.error;
                if (action.payload.status === 'failed') item.retryCount += 1;
            }
        },
        setIsSyncing(state, action: PayloadAction<boolean>) {
            state.isSyncing = action.payload;
        },
    },
});

export const { enqueueAction, dequeueAction, updateActionStatus, setIsSyncing } = syncSlice.actions;

export default syncSlice.reducer;
