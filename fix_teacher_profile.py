import os
import re

def fix_profile():
    path = r"c:\Users\USER\Desktop\Mobile App Dev\TheSeeks Projects\TheSeeks-Teachers\src\screens\settings\TeacherProfileScreen.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Fix enqueueAction and processSyncQueue
    old_sync = """dispatch(enqueueAction({
              type: 'UPDATE_PROFILE',
              payload: { ...profileData, image: imageData },
              timestamp: Date.now(),
            }));
            processSyncQueue(dispatch);"""
    
    new_sync = """dispatch(enqueueAction({
              id: Date.now().toString(),
              actionType: 'UPDATE_PROFILE',
              payload: { ...profileData, image: imageData },
              timestamp: Date.now(),
            }));
            dispatch(processSyncQueue());"""
    
    if old_sync in content:
        content = content.replace(old_sync, new_sync)

    # 2. Move `user` and `profileData` definitions to the top
    # We will remove them from where they are and place them near `const dispatch = useAppDispatch();`
    
    # We need to find the exact lines to remove
    user_line = "const user = useAppSelector((s: any) => s.auth.user);"
    profile_line = "const profileData = useAppSelector((s: any) => s.auth.profile);"
    
    if user_line in content and profile_line in content:
        content = content.replace("  " + user_line + "\n", "")
        content = content.replace("  " + profile_line + "\n", "")
        
        # Now insert them near the top
        insert_point = "const dispatch = useAppDispatch();\n"
        replacement = insert_point + "  " + user_line + "\n  " + profile_line + "\n"
        content = content.replace(insert_point, replacement)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_profile()
