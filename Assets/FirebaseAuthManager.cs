using System.Collections;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase;
using Firebase.Auth;
using UnityEngine.SceneManagement;
using System;
using System.Threading.Tasks;
using i5.Toolkit.Core.ServiceCore;
using i5.Toolkit.Core.OpenIDConnectClient;
using Firebase.Extensions;

public class FirebaseAuthManager : MonoBehaviour
{
    // Firebase variable
    [Header("Firebase")]
    public DependencyStatus dependencyStatus;
    public FirebaseAuth auth;
    public FirebaseUser user;

    // Login Variables
    [Space]
    [Header("Login")]
    public TMP_InputField emailLoginField;
    public TMP_InputField passwordLoginField;

    // Registration Variables
    [Space]
    [Header("Registration")]
    public TMP_InputField nameRegisterField;
    public TMP_InputField emailRegisterField;
    public TMP_InputField passwordRegisterField;
    public TMP_InputField confirmPasswordRegisterField;

    [SerializeField] GameObject loadingScreen;
    [SerializeField] GameObject loginScreen;
    [SerializeField] GameObject loggedInScreen;
    [SerializeField] GameObject registerScreen;

    [SerializeField] TextMeshProUGUI debugText;

    private void Start()
    {
        debugText.text = "Debug:\n";
        StartCoroutine(CheckAndFixDependenciesAsync());
        //FirebaseApp.Create();
    }

    private IEnumerator CheckAndFixDependenciesAsync()
    {
        if (dependencyStatus == DependencyStatus.Available)
        {
            debugText.text += "3\n";
            InitializeFirebase();
            debugText.text += "4\n";
            yield return StartCoroutine(CheckForAutoLogin());
            debugText.text += "5\n";
        }
        else
        {
            debugText.text += "Could not resolve all Firebase dependencies: " + dependencyStatus + "\n";
        }
    }

    void InitializeFirebase()
    {
        //Set the default instance object

        debugText.text += "4\n";
        auth = FirebaseAuth.DefaultInstance;

        debugText.text += "5\n";
        auth.StateChanged += AuthStateChanged;
        debugText.text += "6\n";
        AuthStateChanged(this, null);
        debugText.text += "7\n";
        debugText.text += "Firebase initialized\n";
        debugText.text += "8\n";
    }

    private IEnumerator CheckForAutoLogin()
    {
        if(user != null)
        {
            var reloadUserTask = user.ReloadAsync();

            yield return new WaitUntil(() => reloadUserTask.IsCompleted);

            AutoLogin();
        }
        else
        {
            debugText.text += "Not logged in: redirecting to register screen\n";
            loadingScreen.SetActive(false);
            registerScreen.SetActive(true);
        }
    }
    private void AutoLogin()
    {
        if(user != null)
        {
            References.userName = user.DisplayName;
            debugText.text += "Auto logged in:" + user.DisplayName+"\n";
            loadingScreen.SetActive(false);
            loginScreen.SetActive(false);
            loggedInScreen.SetActive(true);
        }
        else
        {
            debugText.text += "Not logged in: redirecting to register screen\n";
            registerScreen.SetActive(true);
            loadingScreen.SetActive(false);
        }
    }

    // Track state changes of the auth object.
    void AuthStateChanged(object sender, System.EventArgs eventArgs)
    {
        if (auth.CurrentUser != user)
        {
            bool signedIn = user != auth.CurrentUser && auth.CurrentUser != null;

            if (!signedIn && user != null)
            {
                Debug.Log("Signed out " + user.UserId);
                ClearLoginInputFieldText();
            }

            user = auth.CurrentUser;

            if (signedIn)
            {
                Debug.Log("Signed in " + user.UserId);
            }
        }
    }

    private void ClearLoginInputFieldText()
    {
        emailLoginField.text = "";
        passwordLoginField.text = "";
    }

    public void Login()
    {
        StartCoroutine(LoginAsync(emailLoginField.text, passwordLoginField.text));
    }

    private IEnumerator LoginAsync(string email, string password)
    {
        var loginTask = auth.SignInWithEmailAndPasswordAsync(email, password);

        yield return new WaitUntil(() => loginTask.IsCompleted);

        if (loginTask.Exception != null)
        {
            Debug.LogError(loginTask.Exception);

            FirebaseException firebaseException = loginTask.Exception.GetBaseException() as FirebaseException;
            AuthError authError = (AuthError)firebaseException.ErrorCode;


            string failedMessage = "Login Failed! Because ";

            switch (authError)
            {
                case AuthError.InvalidEmail:
                    failedMessage += "Email is invalid";
                    break;
                case AuthError.WrongPassword:
                    failedMessage += "Wrong Password";
                    break;
                case AuthError.MissingEmail:
                    failedMessage += "Email is missing";
                    break;
                case AuthError.MissingPassword:
                    failedMessage += "Password is missing";
                    break;
                default:
                    failedMessage = "Login Failed";
                    break;
            }

            Debug.Log(failedMessage);
        }
        else
        {
            user = loginTask.Result.User;

            Debug.LogFormat("{0} You Are Successfully Logged In", user.DisplayName);
            loadingScreen.SetActive(false);
            loginScreen.SetActive(false);
            loggedInScreen.SetActive(true);

            References.userName = user.DisplayName;
            //UnityEngine.SceneManagement.SceneManager.LoadScene("GameScene");
        }
    }

    public void Register()
    {
        StartCoroutine(RegisterAsync(nameRegisterField.text, emailRegisterField.text, passwordRegisterField.text, confirmPasswordRegisterField.text));
    }

    private IEnumerator RegisterAsync(string name, string email, string password, string confirmPassword)
    {
        if (name == "")
        {
            Debug.LogError("User Name is empty");
        }
        else if (email == "")
        {
            Debug.LogError("email field is empty");
        }
        else if (passwordRegisterField.text != confirmPasswordRegisterField.text)
        {
            Debug.LogError("Password does not match");
        }
        else
        {
            var registerTask = auth.CreateUserWithEmailAndPasswordAsync(email, password);

            yield return new WaitUntil(() => registerTask.IsCompleted);

            if (registerTask.Exception != null)
            {
                Debug.LogError(registerTask.Exception);

                FirebaseException firebaseException = registerTask.Exception.GetBaseException() as FirebaseException;
                AuthError authError = (AuthError)firebaseException.ErrorCode;

                string failedMessage = "Registration Failed! Becuase ";
                switch (authError)
                {
                    case AuthError.InvalidEmail:
                        failedMessage += "Email is invalid";
                        break;
                    case AuthError.WrongPassword:
                        failedMessage += "Wrong Password";
                        break;
                    case AuthError.MissingEmail:
                        failedMessage += "Email is missing";
                        break;
                    case AuthError.MissingPassword:
                        failedMessage += "Password is missing";
                        break;
                    default:
                        failedMessage = "Registration Failed";
                        break;
                }

                Debug.Log(failedMessage);
            }
            else
            {
                // Get The User After Registration Success
                user = registerTask.Result.User;

                UserProfile userProfile = new UserProfile { DisplayName = name };

                var updateProfileTask = user.UpdateUserProfileAsync(userProfile);

                yield return new WaitUntil(() => updateProfileTask.IsCompleted);

                if (updateProfileTask.Exception != null)
                {
                    // Delete the user if user update failed
                    user.DeleteAsync();

                    Debug.LogError(updateProfileTask.Exception);

                    FirebaseException firebaseException = updateProfileTask.Exception.GetBaseException() as FirebaseException;
                    AuthError authError = (AuthError)firebaseException.ErrorCode;


                    string failedMessage = "Profile update Failed! Becuase ";
                    switch (authError)
                    {
                        case AuthError.InvalidEmail:
                            failedMessage += "Email is invalid";
                            break;
                        case AuthError.WrongPassword:
                            failedMessage += "Wrong Password";
                            break;
                        case AuthError.MissingEmail:
                            failedMessage += "Email is missing";
                            break;
                        case AuthError.MissingPassword:
                            failedMessage += "Password is missing";
                            break;
                        default:
                            failedMessage = "Profile update Failed";
                            break;
                    }

                    Debug.Log(failedMessage);
                }
                else
                {
                    Debug.Log("Registration Sucessful Welcome " + user.DisplayName);
                    //UIManager.Instance.OpenLoginPanel();
                }
            }
        }
    }
    public void LogOut()
    {
        if(auth != null && user != null)
        {
            auth.SignOut();
            loginScreen.SetActive(true);
            loggedInScreen.SetActive(false);
            loadingScreen.SetActive(false);
        }
    }
    public void SwitchScreens(int num)
    {
        if(num == 0)
        {
            registerScreen.SetActive(false);
            loginScreen.SetActive(true);
        }

        if (num == 1)
        {
            registerScreen.SetActive(true);
            loginScreen.SetActive(false);
        }
    }

    public void GoogleSignIn()
    {
        SignInWithGoogle();
    }

    private async Task SignInWithGoogle()
    {
        ServiceManager.GetService<OpenIDConnectService>().LoginCompleted += OnLoginCompleted;

        await ServiceManager.GetService<OpenIDConnectService>().OpenLoginPageAsync();
    }
    private void OnLoginCompleted(object sender, EventArgs e)
    {
        Debug.Log(message: "Sign In Done");
    }
}