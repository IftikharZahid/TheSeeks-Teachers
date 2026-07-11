import os

def fix_profile_payload():
    path = r"c:\Users\USER\Desktop\Mobile App Dev\TheSeeks Projects\TheSeeks-Teachers\src\screens\settings\TeacherProfileScreen.tsx"
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()

    old_payload = "payload: { ...profileData, image: imageData },"
    new_payload = "payload: { uid: profileData.uid || profileData.id, payload: { ...profileData, image: imageData } },"
    
    if old_payload in content:
        content = content.replace(old_payload, new_payload)

    with open(path, 'w', encoding='utf-8') as f:
        f.write(content)

fix_profile_payload()
