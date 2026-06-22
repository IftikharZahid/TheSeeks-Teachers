import React from "react";
import { View, ActivityIndicator } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
} from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useTheme } from "../context/ThemeContext";
import { useAppSelector } from "../store/hooks";

import { LoginScreen } from "../screens/auth/LoginScreen";
import { WelcomeScreen } from "../screens/auth/WelcomeScreen";

import { AdminTimetableScreen } from "../screens/academics/TimetableScreen";
import { AdminTeachersScreen } from "../screens/users/TeachersScreen";
import { AdminVideoGalleryScreen } from "../screens/media/VideoGalleryScreen";
import { AdminStudentRecordsScreen } from "../screens/users/StudentRecordsScreen";
import { AdminFeeScreen } from "../screens/finance/FeeScreen";

import { AdminAttendanceScreen } from "../screens/academics/AttendanceScreen";
import { StudentProfile } from "../screens/users/TeacherProfile";

import { HelpCenterScreen } from "../screens/settings/HelpCenterScreen";
import { AboutScreen } from "../screens/settings/AboutScreen";
import { PrivacyPolicyScreen } from "../screens/settings/PrivacyPolicyScreen";
import ChangePasswordScreen from "../screens/settings/ChangePasswordScreen";
import { SettingsScreen } from "../screens/settings/SettingsScreen";
import { ProfileScreen } from "../screens/settings/TeacherProfileScreen";
import { TeacherDashboardScreen } from "../screens/dashboards/TeacherDashboardScreen";
import { ClassesListScreen } from "../screens/academics/ClassesListScreen";
import { AttendanceClassesListScreen } from "../screens/academics/AttendanceClassesListScreen";
import { TeacherAssignmentsScreen } from "../screens/academics/TeacherAssignmentsScreen";

// New Class-specific Exams Screens
import { Class9thExamsScreen } from "../screens/exams/Class9thExamsScreen";
import { Class10thExamsScreen } from "../screens/exams/Class10thExamsScreen";
import { Class1stYearExamsScreen } from "../screens/exams/Class1stYearExamsScreen";
import { Class2ndYearExamsScreen } from "../screens/exams/Class2ndYearExamsScreen";
import { GenericExamsScreen } from "../screens/exams/GenericExamsScreen";

import { MessagesScreen } from "../screens/communication/TeacherMessagesScreen";
import { TeacherSuggestionsScreen } from "../screens/communication/TeacherSuggestionsScreen";
import { LibraryScreen } from "../screens/academics/LibraryScreen";
import { TeachersScreen } from "../screens/users/TeachersListScreen";
import { LikedTeachersScreen } from "../screens/users/LikedTeachersScreen";
import { StaffInfoScreen } from "../screens/users/TeacherDetailsScreen";
import { DiaryScreen } from "../screens/diary/ClassListDiaryScreen";
import { ClassDiaryScreen } from "../screens/diary/ClassDiaryScreen";

export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Main: undefined;
  Admin: undefined;
  AdminTimetable: undefined;
  AdminTeachers: undefined;
  AdminVideoGallery: undefined;
  AdminStudentRecords: undefined;
  AdminExams: undefined;
  AdminFeeScreen: undefined;
  
  AdminAttendanceScreen: { selectedClass?: string } | undefined;
  StudentProfile: { student: any };
  HelpCenterScreen: undefined;
  AboutScreen: undefined;
  PrivacyPolicyScreen: undefined;
  ChangePasswordScreen: undefined;
  SettingsScreen: undefined;
  ProfileScreen: undefined;
  TeacherDashboardScreen: undefined;
  ClassesListScreen: undefined;
  AttendanceClassesListScreen: undefined;
  TeacherAssignmentsScreen: undefined;
  Class9thExamsScreen: undefined;
  Class10thExamsScreen: undefined;
  Class1stYearExamsScreen: undefined;
  Class2ndYearExamsScreen: undefined;
  MessagesScreen: undefined;
  TeacherSuggestionsScreen: undefined;
  LibraryScreen: undefined;
  TeachersScreen: undefined;
  LikedTeachersScreen: undefined;
  StaffInfoScreen: { teacher: any };
  DiaryScreen: undefined;
  ClassDiaryScreen: { selectedClass: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export const AppNavigator: React.FC = () => {
  const { theme, isDark } = useTheme();
  const user = useAppSelector((state) => state.auth.user);
  const initializing = useAppSelector((state) => state.auth.initializing);

  const [timedOut, setTimedOut] = React.useState(false);
  React.useEffect(() => {
    const t = setTimeout(() => setTimedOut(true), 4000);
    return () => clearTimeout(t);
  }, []);

  const baseTheme = isDark ? DarkTheme : DefaultTheme;
  const navigationTheme = {
    ...baseTheme,
    colors: {
      ...baseTheme.colors,
      primary: theme.primary,
      background: theme.background,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.error,
    },
  };

  if (initializing && !timedOut) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: theme.background }}>
      <NavigationContainer theme={navigationTheme}>
        <Stack.Navigator
          initialRouteName={user ? "TeacherDashboardScreen" : "Welcome"}
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            gestureEnabled: true,
            gestureDirection: "horizontal",
            presentation: "card",
            animationDuration: 200,
            freezeOnBlur: true,
          }}
        >
          {!user ? (
            <>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="Login" component={LoginScreen} />
            </>
          ) : (
            <>
              <Stack.Screen name="TeacherDashboardScreen" component={TeacherDashboardScreen} />

              <Stack.Screen name="AdminTimetable" component={AdminTimetableScreen} />
              <Stack.Screen name="AdminTeachers" component={AdminTeachersScreen} />
              <Stack.Screen name="AdminVideoGallery" component={AdminVideoGalleryScreen} />
              <Stack.Screen name="AdminStudentRecords" component={AdminStudentRecordsScreen} />
              <Stack.Screen name="AdminFeeScreen" component={AdminFeeScreen} />
              
              <Stack.Screen name="AdminAttendanceScreen" component={AdminAttendanceScreen} />
              <Stack.Screen name="StudentProfile" component={StudentProfile} />
              <Stack.Screen name="HelpCenterScreen" component={HelpCenterScreen} />
              <Stack.Screen name="AboutScreen" component={AboutScreen} />
              <Stack.Screen name="PrivacyPolicyScreen" component={PrivacyPolicyScreen} />
              <Stack.Screen name="ChangePasswordScreen" component={ChangePasswordScreen} />
              <Stack.Screen name="SettingsScreen" component={SettingsScreen} />
              <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
              <Stack.Screen name="ClassesListScreen" component={ClassesListScreen} />
              <Stack.Screen name="AttendanceClassesListScreen" component={AttendanceClassesListScreen} />
              <Stack.Screen name="TeacherAssignmentsScreen" component={TeacherAssignmentsScreen} />
              <Stack.Screen name="Class9thExamsScreen" component={Class9thExamsScreen} />
              <Stack.Screen name="Class10thExamsScreen" component={Class10thExamsScreen} />
              <Stack.Screen name="Class1stYearExamsScreen" component={Class1stYearExamsScreen} />
              <Stack.Screen name="Class2ndYearExamsScreen" component={Class2ndYearExamsScreen} />
              <Stack.Screen name="AdminExams" component={GenericExamsScreen as any} />
              <Stack.Screen name="MessagesScreen" component={MessagesScreen} />
              <Stack.Screen name="TeacherSuggestionsScreen" component={TeacherSuggestionsScreen} />
              <Stack.Screen name="LibraryScreen" component={LibraryScreen} />
              <Stack.Screen name="TeachersScreen" component={TeachersScreen} />
              <Stack.Screen name="LikedTeachersScreen" component={LikedTeachersScreen} />
              <Stack.Screen name="StaffInfoScreen" component={StaffInfoScreen} />
              <Stack.Screen name="DiaryScreen" component={DiaryScreen} />
              <Stack.Screen name="ClassDiaryScreen" component={ClassDiaryScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </View>
  );
};


