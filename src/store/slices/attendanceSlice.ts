import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { db } from '../../api/firebaseConfig';
import { doc, getDoc, setDoc, onSnapshot, collection, getDocs } from 'firebase/firestore';
import type { Dispatch } from '@reduxjs/toolkit';

// ── Types ──────────────────────────────────────────────
export type AttendanceStatus = 'present' | 'absent' | 'late' | 'holiday' | 'pending';

export interface AttendanceRecord {
    date: string;
    status: AttendanceStatus;
    subject?: string;
}

export interface AttendanceData {
    dailyRecords: Record<string, string>;
    records: AttendanceRecord[];
    totalPresent: number;
    totalAbsent: number;
    totalLate: number;
    totalDays: number;
    percentage: number;
}

export type AdminAttendanceDB = Record<string, Record<string, string>>;

interface AttendanceState {
    data: AttendanceData | null;
    isLoading: boolean;
    error: string | null;
    adminDb: AdminAttendanceDB;
    adminLoading: boolean;
    filters: {
        classFilter: string;
        genderFilter: string;
        selectedDate: string | null;
        viewYear: number;
        viewMonth: number;
    };
    isAdminDataLoaded: boolean;
}

const initialState: AttendanceState = {
    data: null,
    isLoading: false,
    error: null,
    adminDb: {},
    adminLoading: false,
    filters: {
        classFilter: 'All',
        genderFilter: 'All',
        selectedDate: null,
        viewYear: new Date().getFullYear(),
        viewMonth: new Date().getMonth(),
    },
    isAdminDataLoaded: false,
};

// ── Thunks ─────────────────────────────────────────────

export const fetchAllAttendanceRecords = createAsyncThunk(
    'attendance/fetchAll',
    async (_, { rejectWithValue }) => {
        try {
            const snap = await getDocs(collection(db, 'attendance'));
            const merged: AdminAttendanceDB = {};
            snap.docs.forEach(d => {
                const dr = d.data().dailyRecords || {};
                const norm: Record<string, string> = {};
                if (typeof dr === 'object' && !Array.isArray(dr)) {
                    Object.keys(dr).forEach(k => {
                        const v = dr[k];
                        norm[k] = typeof v === 'string' ? v : (v?.status ?? '');
                    });
                }
                merged[d.id] = norm;
            });
            return merged;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch all attendance records');
        }
    }
);

export const fetchAttendance = createAsyncThunk(
    'attendance/fetch',
    async (uid: string, { rejectWithValue }) => {
        try {
            const snap = await getDoc(doc(db, 'attendance', uid));
            if (snap.exists()) {
                const d = snap.data();
                const dr = d.dailyRecords || {};
                const norm: Record<string, string> = {};
                if (typeof dr === 'object' && !Array.isArray(dr)) {
                    Object.keys(dr).forEach(k => {
                        const v = dr[k];
                        norm[k] = typeof v === 'string' ? v : (v?.status ?? '');
                    });
                }
                return {
                    dailyRecords: norm,
                    records:      d.records      || [],
                    totalPresent: d.totalPresent || 0,
                    totalAbsent:  d.totalAbsent  || 0,
                    totalLate:    d.totalLate    || 0,
                    totalDays:    d.totalDays    || 0,
                    percentage:   d.percentage   || 0,
                } as AttendanceData;
            }
            return { dailyRecords: {}, records: [], totalPresent: 0, totalAbsent: 0, totalLate: 0, totalDays: 0, percentage: 0 } as AttendanceData;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to fetch attendance');
        }
    }
);

export const writeStudentAttendance = createAsyncThunk(
    'attendance/writeStudent',
    async (payload: { studentId: string }, { getState, rejectWithValue }) => {
        try {
            const { studentId } = payload;
            const state: any = getState();
            const dailyRecords = state.attendance.adminDb[studentId] || {};
            
            let present = 0, absent = 0, late = 0;
            Object.values(dailyRecords).forEach((st: any) => {
                if (st === 'present') present++;
                else if (st === 'absent') absent++;
                else if (st === 'late') late++;
            });
            const total = present + absent + late;
            await setDoc(doc(db, 'attendance', studentId), {
                dailyRecords,
                totalPresent: present,
                totalAbsent:  absent,
                totalLate:    late,
                totalDays:    total,
                percentage:   total > 0 ? Math.round(present / total * 100) : 0,
            }, { merge: true });
            return { studentId };
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to write attendance');
        }
    }
);

/** Legacy alias */
export const saveStudentAttendance = writeStudentAttendance;

// ── Slice ──────────────────────────────────────────────
const attendanceSlice = createSlice({
    name: 'attendance',
    initialState,
    reducers: {
        clearAttendance(state) {
            state.data = null;
            state.error = null;
        },
        setAttendanceData(state, action: PayloadAction<AttendanceData>) {
            state.data = action.payload;
            state.isLoading = false;
            state.error = null;
        },
        setAdminDb(state, action: PayloadAction<AdminAttendanceDB>) {
            state.adminDb = action.payload;
            state.adminLoading = false;
        },
        setAdminLoading(state, action: PayloadAction<boolean>) {
            state.adminLoading = action.payload;
        },
        updateStudentDay(state, action: PayloadAction<{ studentId: string; date: string; status: string }>) {
            const { studentId, date, status } = action.payload;
            if (!state.adminDb[studentId]) state.adminDb[studentId] = {};
            state.adminDb[studentId][date] = status;
        },
        updateAllStudentsDay(state, action: PayloadAction<{ studentIds: string[]; date: string; status: string }>) {
            const { studentIds, date, status } = action.payload;
            studentIds.forEach(id => {
                if (!state.adminDb[id]) state.adminDb[id] = {};
                state.adminDb[id][date] = status;
            });
        },
        setAttendanceFilters(state, action: PayloadAction<Partial<AttendanceState['filters']>>) {
            state.filters = { ...state.filters, ...action.payload };
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAttendance.pending,   s => { s.isLoading = true; s.error = null; })
            .addCase(fetchAttendance.fulfilled,  (s, a) => { s.data = a.payload; s.isLoading = false; })
            .addCase(fetchAttendance.rejected,   (s, a) => { s.isLoading = false; s.error = a.payload as string; })
            .addCase(fetchAllAttendanceRecords.pending, s => { s.adminLoading = true; })
            .addCase(fetchAllAttendanceRecords.fulfilled, (s, a) => {
                s.adminDb = a.payload;
                s.adminLoading = false;
                s.isAdminDataLoaded = true;
            })
            .addCase(fetchAllAttendanceRecords.rejected, s => { s.adminLoading = false; });
    },
});

export const {
    clearAttendance,
    setAttendanceData,
    setAdminDb,
    setAdminLoading,
    updateStudentDay,
    updateAllStudentsDay,
    setAttendanceFilters,
} = attendanceSlice.actions;

export default attendanceSlice.reducer;

// ── Real-time listener (student screen) ──────────────
export const initAttendanceListener = (dispatch: Dispatch, uid: string) => {
    dispatch(setAttendanceData({ dailyRecords: {}, records: [], totalPresent: 0, totalAbsent: 0, totalLate: 0, totalDays: 0, percentage: 0 }));
    return onSnapshot(
        doc(db, 'attendance', uid),
        snap => {
            if (snap.exists()) {
                const d = snap.data();
                const dr = d.dailyRecords || {};
                const norm: Record<string, string> = {};
                if (typeof dr === 'object' && !Array.isArray(dr)) {
                    Object.keys(dr).forEach(k => {
                        const v = dr[k];
                        norm[k] = typeof v === 'string' ? v : (v?.status ?? '');
                    });
                }
                dispatch(setAttendanceData({
                    dailyRecords: norm,
                    records:      d.records      || [],
                    totalPresent: d.totalPresent || 0,
                    totalAbsent:  d.totalAbsent  || 0,
                    totalLate:    d.totalLate    || 0,
                    totalDays:    d.totalDays    || 0,
                    percentage:   d.percentage   || 0,
                }));
            }
        },
        err => console.warn('Attendance listener error:', err)
    );
};
