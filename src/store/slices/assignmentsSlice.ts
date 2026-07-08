import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { db } from '../../api/firebaseConfig';
import { collection, getDocs, doc, getDoc, query, where, orderBy, setDoc, deleteDoc } from 'firebase/firestore';
import { enqueueAction } from './syncSlice';
import { processSyncQueue } from '../syncManager';

interface AssignmentsState {
  assignments: any[];
  availableClasses: string[];
  isLoading: boolean;
  isClassesLoading: boolean;
  lastFetched: number | null;
}

const initialState: AssignmentsState = {
  assignments: [],
  availableClasses: [],
  isLoading: false,
  isClassesLoading: false,
  lastFetched: null,
};

export const fetchTeacherAssignments = createAsyncThunk(
  'assignments/fetchTeacherAssignments',
  async ({ teacherName, forceRefresh }: { teacherName: string; forceRefresh?: boolean }, { getState }) => {
    const state = getState() as any;
    const { lastFetched, assignments } = state.assignments;
    
    // Cache for 5 minutes if not forced
    if (!forceRefresh && lastFetched && Date.now() - lastFetched < 5 * 60 * 1000 && assignments.length > 0) {
      return { assignments, fromCache: true };
    }

    try {
      // It is often better to query server-side, but we fall back to client sorting
      const q = query(
        collection(db, 'assignments'),
        where('teacherName', '==', teacherName)
      );
      
      const snap = await getDocs(q);
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      
      return { assignments: data, fromCache: false };
    } catch (e: any) {
      // Fallback to fetching all and filtering client-side in case of missing index
      console.log('Query failed, falling back to client-side filtering:', e.message);
      const snap = await getDocs(collection(db, 'assignments'));
      let data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      data = data.filter((a: any) => a.teacherName === teacherName);
      data.sort((a: any, b: any) => (b.createdAt || 0) - (a.createdAt || 0));
      return { assignments: data, fromCache: false };
    }
  }
);

export const fetchAvailableClasses = createAsyncThunk(
  'assignments/fetchAvailableClasses',
  async () => {
    const snap = await getDoc(doc(db, 'appSettings', 'classes'));
    if (snap.exists() && snap.data().list) {
      return snap.data().list;
    }
    return [];
  }
);

export const saveAssignment = createAsyncThunk(
  'assignments/save',
  async (assignmentData: any, { dispatch, rejectWithValue }) => {
    try {
      // Optimistic update locally
      dispatch(assignmentsSlice.actions.addAssignmentOptimistic(assignmentData));

      // Queue for offline sync
      dispatch(enqueueAction({
          id: `save_assignment_${assignmentData.id}_${Date.now()}`,
          actionType: 'WRITE_ASSIGNMENT',
          payload: { assignmentId: assignmentData.id, payload: assignmentData },
          timestamp: Date.now(),
      }));

      // @ts-ignore
      dispatch(processSyncQueue());
      return assignmentData;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

export const deleteAssignment = createAsyncThunk(
  'assignments/delete',
  async (id: string, { dispatch, rejectWithValue }) => {
    try {
      dispatch(assignmentsSlice.actions.removeAssignmentOptimistic(id));

      dispatch(enqueueAction({
          id: `delete_assignment_${id}_${Date.now()}`,
          actionType: 'DELETE_ASSIGNMENT',
          payload: { assignmentId: id },
          timestamp: Date.now(),
      }));

      // @ts-ignore
      dispatch(processSyncQueue());
      return id;
    } catch (e: any) {
      return rejectWithValue(e.message);
    }
  }
);

const assignmentsSlice = createSlice({
  name: 'assignments',
  initialState,
  reducers: {
    setAvailableClasses(state, action: PayloadAction<string[]>) {
      state.availableClasses = action.payload;
      state.isClassesLoading = false;
    },
    addAssignmentOptimistic(state, action: PayloadAction<any>) {
      state.assignments = [action.payload, ...state.assignments];
    },
    removeAssignmentOptimistic(state, action: PayloadAction<string>) {
      state.assignments = state.assignments.filter(a => a.id !== action.payload);
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchTeacherAssignments.pending, (state, action) => {
        // Only set loading true if not from cache
        if (!action.meta.arg.forceRefresh && state.assignments.length > 0) {
          // keep silent loading
        } else {
          state.isLoading = true;
        }
      })
      .addCase(fetchTeacherAssignments.fulfilled, (state, action) => {
        state.isLoading = false;
        if (!action.payload.fromCache) {
          state.assignments = action.payload.assignments;
          state.lastFetched = Date.now();
        }
      })
      .addCase(fetchTeacherAssignments.rejected, (state) => {
        state.isLoading = false;
      })
      .addCase(fetchAvailableClasses.pending, (state) => {
        state.isClassesLoading = true;
      })
      .addCase(fetchAvailableClasses.fulfilled, (state, action) => {
        state.isClassesLoading = false;
        state.availableClasses = action.payload;
      })
      .addCase(fetchAvailableClasses.rejected, (state) => {
        state.isClassesLoading = false;
      });
  }
});

export const { addAssignmentOptimistic, removeAssignmentOptimistic, setAvailableClasses } = assignmentsSlice.actions;
export default assignmentsSlice.reducer;
