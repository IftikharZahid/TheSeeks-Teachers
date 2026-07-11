import os
import re

def robust_fix():
    path = r"c:\Users\USER\Desktop\Mobile App Dev\TheSeeks Projects\TheSeeks-Teachers\src\screens\settings\TeacherProfileScreen.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # Fix the enqueueAction
    content = re.sub(
        r"dispatch\(enqueueAction\(\{\s*type:\s*'UPDATE_PROFILE',\s*payload:\s*\{\s*\.\.\.profileData,\s*image:\s*imageData\s*\},.*?\}\)\);",
        r"dispatch(enqueueAction({ id: Date.now().toString(), actionType: 'UPDATE_PROFILE', payload: { uid: profileData.uid || profileData.id, payload: { ...profileData, image: imageData } }, timestamp: Date.now() }));",
        content, flags=re.DOTALL
    )
    
    # Fix processSyncQueue
    content = content.replace("processSyncQueue(dispatch);", "dispatch(processSyncQueue());")
    
    # Move user and profileData
    if "const user = useAppSelector" in content and "const profileData = useAppSelector" in content:
        # Extract them
        lines = content.split('\n')
        new_lines = []
        user_line = ""
        profile_line = ""
        for line in lines:
            if "const user = useAppSelector" in line:
                user_line = line.strip()
            elif "const profileData = useAppSelector" in line:
                profile_line = line.strip()
            else:
                new_lines.append(line)
                
        # Insert them after dispatch
        for i, line in enumerate(new_lines):
            if "const dispatch = useAppDispatch();" in line:
                new_lines.insert(i + 1, "  " + user_line)
                new_lines.insert(i + 2, "  " + profile_line)
                break
                
        content = '\n'.join(new_lines)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

robust_fix()
