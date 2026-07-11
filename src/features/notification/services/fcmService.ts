import Constants, { ExecutionEnvironment } from 'expo-constants';

let Notifications: any = null;
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
if (!isExpoGo) {
  Notifications = require('expo-notifications');
}
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { db } from '../../../api/firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';

export async function registerForPushNotificationsAsync(userId: string, profile: any) {
    let token;

    if (!Notifications) {
        console.log('Push notifications are not supported in Expo Go on SDK 53+');
        return;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    if (Device.isDevice) {
        const existingPermissions = await Notifications.getPermissionsAsync() as any;
        let finalStatus = existingPermissions.status || (existingPermissions.granted ? 'granted' : 'denied');
        
        if (finalStatus !== 'granted') {
            const requestedPermissions = await Notifications.requestPermissionsAsync() as any;
            finalStatus = requestedPermissions.status || (requestedPermissions.granted ? 'granted' : 'denied');
        }
        
        if (finalStatus !== 'granted') {
            console.log('Failed to get push token for push notification!');
            return;
        }
        
        // Get Expo Push Token for Expo Go support
        token = (await Notifications.getExpoPushTokenAsync({
            projectId: 'theseeksacademy-teachers'
        })).data;
        console.log("Expo Push Token:", token);

        // Build topics array based on Teacher profile
        const topics = ['teacher'];
        if (profile?.instituteId) topics.push(`teacher_${profile.instituteId}`);
        if (profile?.departmentId) topics.push(`teacher_${profile.departmentId}`);
        if (profile?.subjects && Array.isArray(profile.subjects)) {
            profile.subjects.forEach((sub: string) => topics.push(`teacher_${sub}`));
        } else if (profile?.subject) {
            topics.push(`teacher_${profile.subject}`);
        }

        // Save token and topics to Firestore
        try {
            await setDoc(doc(db, 'fcmTokens', userId), {
                token,
                platform: Platform.OS,
                role: 'teacher',
                topics,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        } catch (error) {
            console.error("Error saving token to Firestore:", error);
        }
    } else {
        console.log('Must use physical device for Push Notifications');
    }

    return token;
}
