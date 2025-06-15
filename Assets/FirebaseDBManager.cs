using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread
using Firebase.Auth;
using System;

public class FirebaseDBManager : MonoBehaviour
{
    private FirebaseFirestore db;
    public FirebaseUser pUser;
    void Start()
    {
        // Get the Firestore instance
        DontDestroyOnLoad(this);
        db = FirebaseFirestore.DefaultInstance;

    }

    public void CreateUserAuthData(string email, FirebaseUser userGB)
    {
        pUser = userGB;
        DocumentReference docRef = db.Collection("userInfo").Document(userGB.UserId);
        Dictionary<string, object> user = new Dictionary<string, object>
{
    { "Email", email },
    { "Date Joined", DateTime.Now},
    { "UserConfig", false}

};
        docRef.SetAsync(user).ContinueWithOnMainThread(task =>
        {
            if (task.IsCompleted && !task.IsFaulted && !task.IsCanceled)
            {
                Debug.Log("Added data to the user document in the users collection.");
            }
            else
            {
                Debug.LogError("Failed to add document: " + task.Exception);
            }
        });
    }
}