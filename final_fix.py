import os

def final_fix():
    path = r"c:\Users\USER\Desktop\Mobile App Dev\TheSeeks Projects\TheSeeks-Teachers\src\screens\settings\TeacherProfileScreen.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    # We need to change:
    # dispatch(enqueueAction({
    # type: 'UPDATE_PROFILE',
    # payload: { uid: profileData.uid || profileData.id, payload: { ...profileData, image: imageData } },
    # timestamp: Date.now(),
    # }));
    # TO
    # dispatch(enqueueAction({
    # id: Date.now().toString(),
    # actionType: 'UPDATE_PROFILE',
    # payload: { uid: profileData.uid || profileData.id, payload: { ...profileData, image: imageData } },
    # timestamp: Date.now(),
    # }));
    
    content = content.replace("type: 'UPDATE_PROFILE',", "id: Date.now().toString(),\n              actionType: 'UPDATE_PROFILE',")

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

final_fix()
