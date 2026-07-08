import NetInfo from '@react-native-community/netinfo';
import { Dispatch } from '@reduxjs/toolkit';
import { setIsSyncing, dequeueAction, updateActionStatus } from './slices/syncSlice';
import { RootState } from './store';
import { db } from '../api/firebaseConfig';
import { doc, setDoc, deleteDoc, addDoc, collection, updateDoc, serverTimestamp } from 'firebase/firestore';

export const processSyncQueue = () => async (dispatch: any, getState: () => RootState) => {
    const state = getState();
    const { pendingQueue, isSyncing } = state.sync;

    if (isSyncing || pendingQueue.length === 0) return;

    // Check actual network status before proceeding
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) return;

    dispatch(setIsSyncing(true));

    for (const action of pendingQueue) {
        if (action.status === 'processing') continue;

        try {
            dispatch(updateActionStatus({ id: action.id, status: 'processing' }));
            
            // Execute the action based on its type
            switch (action.actionType) {
                case 'WRITE_ATTENDANCE': {
                    const { studentId, payload } = action.payload;
                    await setDoc(doc(db, 'attendance', studentId), payload, { merge: true });
                    break;
                }
                case 'WRITE_RESULT': {
                    const { resultId, payload } = action.payload;
                    // If resultId exists, it's an update, otherwise it's a new add
                    if (resultId) {
                         await setDoc(doc(db, 'exams', resultId), payload, { merge: true });
                    } else {
                         // Fallback logic, but ideally the UI generates a unique ID via uuid or doc().id before dispatching
                         await setDoc(doc(db, 'exams', payload.id), payload, { merge: true });
                    }
                    break;
                }
                case 'DELETE_RESULT': {
                    const { resultId } = action.payload;
                    await deleteDoc(doc(db, 'exams', resultId));
                    break;
                }
                case 'WRITE_ASSIGNMENT': {
                    const { assignmentId, payload } = action.payload;
                    await setDoc(doc(db, 'assignments', assignmentId), payload, { merge: true });
                    break;
                }
                case 'DELETE_ASSIGNMENT': {
                    const { assignmentId } = action.payload;
                    await deleteDoc(doc(db, 'assignments', assignmentId));
                    break;
                }
                case 'SEND_MESSAGE': {
                    const { groupId, messageId, payload } = action.payload;
                    await setDoc(doc(db, 'chatGroups', groupId, 'messages', messageId), {
                        ...payload,
                        timestamp: serverTimestamp(),
                        createdAt: serverTimestamp(),
                    });
                    break;
                }
                case 'DELETE_MESSAGE': {
                    const { groupId, messageId } = action.payload;
                    await deleteDoc(doc(db, 'chatGroups', groupId, 'messages', messageId));
                    break;
                }
                case 'EDIT_MESSAGE': {
                    const { groupId, messageId, payload } = action.payload;
                    await updateDoc(doc(db, 'chatGroups', groupId, 'messages', messageId), payload);
                    break;
                }
                case 'UPDATE_GALLERY_VIDEOS': {
                    const { galleryId, videos } = action.payload;
                    await updateDoc(doc(db, 'videoGalleries', galleryId), { videos, updatedAt: serverTimestamp() });
                    break;
                }
                case 'SUBMIT_COMPLAINT': {
                    const payload = { ...action.payload };
                    // Replace fake local timestamp with server timestamp
                    payload.createdAt = serverTimestamp();
                    await setDoc(doc(db, 'complaints', action.payload.id), payload);
                    break;
                }
                case 'SUBMIT_SUGGESTION': {
                    const payload = { ...action.payload };
                    payload.createdAt = serverTimestamp();
                    await setDoc(doc(db, 'suggestions', action.payload.id), payload);
                    break;
                }
                case 'UPDATE_PROFILE': {
                    const { uid, payload } = action.payload;
                    // Update both 'profile' and 'users' collections just in case
                    try { await updateDoc(doc(db, 'profile', uid), payload); } catch(e) { console.warn('Could not update profile/', e); }
                    try { await updateDoc(doc(db, 'users', uid), payload); } catch(e) { console.warn('Could not update users/', e); }
                    break;
                }
                // Add more cases as we refactor other slices
                default:
                    console.warn('Unknown sync action type:', action.actionType);
            }

            // On success, dequeue
            dispatch(dequeueAction({ id: action.id }));
        } catch (error: any) {
            console.error('Failed to sync action:', action.actionType, error);
            dispatch(updateActionStatus({ id: action.id, status: 'failed', error: error.message }));
        }
    }

    dispatch(setIsSyncing(false));
};

export const initSyncListener = (dispatch: Dispatch | any) => {
    return NetInfo.addEventListener(state => {
        if (state.isConnected) {
            dispatch(processSyncQueue());
        }
    });
};
