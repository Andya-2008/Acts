using Firebase.Auth;
using UnityEngine;
using UnityEngine.SceneManagement;

public class LogOutButton : MonoBehaviour
{
    public FirebaseAuth auth;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void LogOut()
    {
        auth = FirebaseAuth.DefaultInstance;
        auth.SignOut();
        Destroy(GameObject.Find("FirebaseDBManager"));
        Destroy(GameObject.Find("FirebaseAuthManager"));
        SceneManager.LoadScene(0);
    }
}
