using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread
using Firebase.Auth;
using System;
using TMPro;
using UnityEngine.Android;

public class UserConfigManager : MonoBehaviour
{
    private FirebaseFirestore db;
    FirebaseUser user;
    public FirebaseAuthManager fbAuthManager;

    [Header("Screen1")]
    [SerializeField] TMP_InputField first;
    [SerializeField] TMP_InputField last;
    [SerializeField] TMP_InputField dobD;
    [SerializeField] TMP_InputField dobM;
    [SerializeField] TMP_InputField dobY;
    [SerializeField] TMP_InputField username;
    [SerializeField] List<GameObject> screens = new List<GameObject>();
    [SerializeField] List<PersonalityButtonPress> personalityButtons = new List<PersonalityButtonPress>();
    void Start()
    {
        // Get the Firestore instance
        fbAuthManager = GameObject.Find("FirebaseAuthManager").GetComponent<FirebaseAuthManager>();
        user = fbAuthManager.user;
        db = FirebaseFirestore.DefaultInstance;

    }
    
    public void AddUserInfoScreen1()
    {
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "First", first.text },
            { "Last", last.text },
            {"DOB", dobM.text + "/" + dobD.text + "/" + dobY.text}
        }, SetOptions.MergeAll);
        Debug.Log("Added first, last, and date of birth");
        screens[0].SetActive(false);
        screens[1].SetActive(true);
    }
    public void AddUserInfoPersonalities()
    {
        List<string> traits = new List<string>();
        foreach(PersonalityButtonPress button in personalityButtons)
        {
            if(button.selected)
            traits.Add(button.name + ": " + button.descriptionText.text);
        }
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "Traits", traits}
        }, SetOptions.MergeAll);
        Debug.Log("Added first, last, and date of birth");
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
            Permission.RequestUserPermission(Permission.Camera);
            Debug.LogError("Doesn't have camera permission");
            return;
        }
        if (!Permission.HasUserAuthorizedPermission("android.permission.POST_NOTIFICATIONS"))
        {
            Debug.LogError("Doesn't have notification permission");
            return;
        }

#elif UNITY_IOS
        // iOS automatically prompts the first time camera is accessed.
        // You just need to provide a usage description (see next step).
        Debug.Log("iOS will request camera permission automatically when used.");
#endif


        Debug.Log("Added Permissions");
        screens[2].SetActive(false);
        screens[3].SetActive(true);
    }
    public void AddUserInfoUsernameAndPFP()
    {
        //GameObject.Find("ProfilePictureManager").GetComponent<ProfilePictureManager>().LoadProfilePicture();
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "Username", username.text}
        }, SetOptions.MergeAll);
        Debug.Log("Added first, last, and date of birth");
        screens[3].SetActive(false);
        screens[4].SetActive(true);
    }
}