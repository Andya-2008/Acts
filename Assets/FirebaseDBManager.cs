using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread
using Firebase;
using Firebase.Auth;
using System;

public class FirebaseDBManager : MonoBehaviour
{
    private FirebaseFirestore db;
    void Start()
    {
        // Get the Firestore instance
        db = FirebaseFirestore.DefaultInstance;

    }

    public void CreateUserAuthData(string email, string username, FirebaseUser userGB)
    {
        DocumentReference docRef = db.Collection("userInfo").Document(userGB.UserId);
        Dictionary<string, object> user = new Dictionary<string, object>
{
    { "Email", email },
    { "Username", username },
    { "Date Joined", DateTime.Now}
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
    public void CreateGoogleUserAuthData(string email, FirebaseUser userGB)
    {
        DocumentReference docRef = db.Collection("userInfo").Document(userGB.UserId);
        Dictionary<string, object> user = new Dictionary<string, object>
{
    { "Email", email },
    { "Date Joined", DateTime.Now}
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
    public void AddUserInfo(string first, string last, bool configDone, FirebaseUser userGB)
    {
        DocumentReference docRef = db.Collection("userInfo").Document(userGB.UserId);
        docRef.SetAsync(new Dictionary<string, object> {
            { "First", first },
            { "Last", last },
            {"ConfigDone", configDone}
        }, SetOptions.MergeAll);
    }
}