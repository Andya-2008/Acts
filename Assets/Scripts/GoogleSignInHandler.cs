using System;
using Firebase;
using Firebase.Auth;
using Google;
using UnityEngine;

public class GoogleSignInHandler : MonoBehaviour
{
    private GoogleSignInConfiguration config;
    [SerializeField] GameObject loginScreen;
    [SerializeField] GameObject loggedInScreen;
    [SerializeField] GameObject registerScreen;

    void Start()
    {
        config = new GoogleSignInConfiguration
        {
            WebClientId = "982448249723-c2vjbtng9uv02f7dgg8s14iv3ija1aev.apps.googleusercontent.com",
            RequestIdToken = true,
            RequestEmail = true,
            UseGameSignIn = false
        };

        GoogleSignIn.Configuration = config;
        GoogleSignIn.DefaultInstance.SignOut();  // optional
    }

    public void SignInWithGoogle()
    {
        GoogleSignIn.DefaultInstance.SignIn().ContinueWith(OnGoogleAuthFinished);
    }

    private void OnGoogleAuthFinished(System.Threading.Tasks.Task<GoogleSignInUser> task)
    {
        if (task.IsFaulted)
        {
            Debug.LogError("Google sign-in failed: " + task.Exception);
        }
        else
        {
            var credential = GoogleAuthProvider.GetCredential(task.Result.IdToken, null);
            FirebaseAuth.DefaultInstance.SignInWithCredentialAsync(credential).ContinueWith(authTask =>
            {
                if (authTask.IsCanceled || authTask.IsFaulted)
                {
                    Debug.LogError("Firebase sign-in failed: " + authTask.Exception);
                }
                else
                {
                    FirebaseUser user = authTask.Result;

                    string email = user.Email;

                    // Save user info to Firestore
                    GameObject.Find("FirebaseDBManager").GetComponent<FirebaseDBManager>().CreateGoogleUserAuthData(email, user);
                    //Debug.LogError("Firebase sign-in successful: " + authTask.Result.DisplayName);
                    registerScreen.SetActive(false);
                    loginScreen.SetActive(false);
                    loggedInScreen.SetActive(true);
                }
            });
        }
    }
}