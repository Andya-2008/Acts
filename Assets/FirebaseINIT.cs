using Firebase;
using Firebase.Extensions;
using UnityEngine;
using UnityEngine.SceneManagement;

public class FirebaseINIT : MonoBehaviour
{
    void Start()
    {
        CheckIfReady();
    }

    public static void CheckIfReady()
    {
        FirebaseApp.CheckAndFixDependenciesAsync().ContinueWithOnMainThread(task => {
            DependencyStatus dependencyStatus = task.Result;
            if (dependencyStatus == DependencyStatus.Available)
            {
                FirebaseApp app = FirebaseApp.DefaultInstance;
                SceneManager.LoadScene("StartingScene");
                Debug.Log("Firebase is ready for use.");
            }
            else
            {
                Debug.LogError(System.String.Format(
                  "Could not resolve all Firebase dependencies: {0}", dependencyStatus));
            }
        });
    }
}