using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread
using Firebase.Auth;
using System;
using TMPro;
using UnityEngine.Android;
using UnityEngine.SceneManagement;
using UnityEngine.UI;

public class UserConfigManager : MonoBehaviour
{
    private FirebaseFirestore db;
    FirebaseUser user;
    public FirebaseAuthManager fbAuthManager;

    [Header("Screen1")]
    [SerializeField] TMP_InputField first;
    [SerializeField] TMP_InputField last;
    [SerializeField] TMP_InputField phone;
    [SerializeField] TMP_InputField dobD;
    [SerializeField] TMP_InputField dobM;
    [SerializeField] TMP_InputField dobY;
    [SerializeField] TMP_InputField username;
    [SerializeField] List<GameObject> screens = new List<GameObject>();
    [SerializeField] List<PersonalityButtonPress> personalityButtons = new List<PersonalityButtonPress>();

    [SerializeField] Image CameraCover;
    [SerializeField] Image NotifCover;
    void Start()
    {
        // Get the Firestore instance
        fbAuthManager = GameObject.Find("FirebaseAuthManager").GetComponent<FirebaseAuthManager>();
        user = fbAuthManager.user;
        db = FirebaseFirestore.DefaultInstance;

    }
    private void Update()
    {

#if UNITY_ANDROID
        if (Permission.HasUserAuthorizedPermission(Permission.Camera))
        {
            CameraCover.enabled = true;
        }
        else
        {
            CameraCover.enabled = false;
        }


        if (Permission.HasUserAuthorizedPermission("android.permission.POST_NOTIFICATIONS"))
        {
            NotifCover.enabled = true;
        }
        else
        {
            NotifCover.enabled = false;
        }
#endif
    }
    public void AddUserInfoScreen1()
    {
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        string phoneNum = System.Text.RegularExpressions.Regex.Replace(phone.text, @"[^0-9]", string.Empty) ?? string.Empty;
        docRef.SetAsync(new Dictionary<string, object> {
            { "First", first.text },
            { "Last", last.text },
            {"DOB", dobM.text + "/" + dobD.text + "/" + dobY.text},
            {"Phone", phoneNum}

        }, SetOptions.MergeAll);
        screens[0].SetActive(false);
        screens[1].SetActive(true);
    }
    public void AddUserInfoPersonalities()
    {
        List<string> traits = new List<string>();
        foreach(PersonalityButtonPress button in personalityButtons)
        {
            if(button.selected)
            traits.Add(button.name/* + ": " + button.descriptionText.text*/);
        }
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "Traits", traits}
        }, SetOptions.MergeAll);
        screens[1].SetActive(false);
        screens[2].SetActive(true);
        GameObject.Find("PermissionManager").GetComponent<CameraPermissionManager>().RequestCameraPermission();
        GameObject.Find("PermissionManager").GetComponent<PushNotificationManager>().RequestPushPermission();
    }
    public void PermissionCheck()
    {
#if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission(Permission.Camera))
        {
            GameObject.Find("PermissionManager").GetComponent<CameraPermissionManager>().RequestCameraPermission();
            return;
        }
        if (!Permission.HasUserAuthorizedPermission("android.permission.POST_NOTIFICATIONS"))
        {
            GameObject.Find("PermissionManager").GetComponent<PushNotificationManager>().RequestPushPermission();
            return;
        }
#endif


        screens[2].SetActive(false);
        screens[3].SetActive(true);
    }

    public void AskPermissions(int permission)
    {
#if UNITY_ANDROID
        if (permission == 0)
        {
            GameObject.Find("PermissionManager").GetComponent<CameraPermissionManager>().RequestCameraPermission();
            Debug.Log("📷 Camera permission requested.");
        }
        else if (permission == 1)
        {
            GameObject permissionManager = GameObject.Find("PermissionManager");
            if (permissionManager != null)
            {
                var pushManager = permissionManager.GetComponent<PushNotificationManager>();
                if (pushManager != null)
                {
                    pushManager.RequestPushPermission();
                    Debug.Log("🔔 Push notification permission requested.");
                }
                else
                {
                    Debug.LogError("❌ PushNotificationManager component not found on PermissionManager.");
                }
            }
            else
            {
                Debug.LogError("❌ PermissionManager GameObject not found.");
            }
        }
#endif
    }
    public void AddUserInfoUsernameAndPFP()
    {
        //GameObject.Find("ProfilePictureManager").GetComponent<ProfilePictureManager>().LoadProfilePicture();
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "Username", username.text}
        }, SetOptions.MergeAll);
        screens[3].SetActive(false);
        screens[4].SetActive(true);
#if UNITY_ANDROID
        {
            RequestContactsPermission();
            GameObject.Find("FriendContactManager").GetComponent<ContactImportManager>().StartContactImport();
        }
#endif
    }

    public void UserConfigFinished()
    {
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "UserConfig", true}
        }, SetOptions.MergeAll);
        SceneManager.LoadScene("MainAppScene");
    }

    public void RequestContactsPermission()
    {
    #if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission("android.permission.READ_CONTACTS"))
        {
            Permission.RequestUserPermission("android.permission.READ_CONTACTS");
        }
    #endif
    }
}
