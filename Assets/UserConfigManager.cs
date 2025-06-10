using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread
using Firebase.Auth;
using System;
using TMPro;

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
    }
}