using System.Collections;
using UnityEngine;
using TMPro;
using Firebase;
using Firebase.Auth;
using System;
using UnityEngine.SceneManagement;
using Firebase.Firestore;
using System.Threading.Tasks;
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
    public TMP_InputField emailRegisterField;
    public TMP_InputField passwordRegisterField;
    public TMP_InputField confirmPasswordRegisterField;

    [SerializeField] GameObject loadingScreen;
    [SerializeField] GameObject loginScreen;
    [SerializeField] GameObject registerScreen;

    [SerializeField] TextMeshProUGUI registerErrorText;
    private FirebaseFirestore db;

    [SerializeField] AuthSceneAnimation authCanvas;

    [SerializeField] TextMeshProUGUI loginErrorText;

    private void Start()
    {
        //DontDestroyOnLoad(this);
        StartCoroutine(CheckAndFixDependenciesAsync());
        DontDestroyOnLoad(this);
        //FirebaseApp.Create();
        db = FirebaseFirestore.DefaultInstance;
    }

    private IEnumerator CheckAndFixDependenciesAsync()
    {
        if (dependencyStatus == DependencyStatus.Available)
        {
            InitializeFirebase();
            yield return StartCoroutine(CheckForAutoLogin());
        }
        else
        {
            Debug.Log("Could not resolve all Firebase dependencies: " + dependencyStatus + "\n");
        }
    }

    void InitializeFirebase()
    {
        //Set the default instance object

        auth = FirebaseAuth.DefaultInstance;

        auth.StateChanged += AuthStateChanged;
        AuthStateChanged(this, null);
    }

    private IEnumerator CheckForAutoLogin()
    {
        if(user != null)
        {
            var reloadUserTask = user.ReloadAsync();

            yield return new WaitUntil(() => reloadUserTask.IsCompleted);

            StartCoroutine(AutoLogin());
        }
        else
        {
            authCanvas.FinishLoadingFirebase();
        }
    }
    private IEnumerator AutoLogin()
    {
        if(user != null)
        {
            References.userName = user.DisplayName;
            authCanvas.ConfigLoader();
            yield return new WaitForSeconds(.5f);
            CheckUserConfig(isFinished => {
                if (isFinished)
                    SceneManager.LoadScene("MainAppScene");
                else
                    SceneManager.LoadScene("UserConfigScene");
            });
        }
        else
        {
            authCanvas.FinishLoadingFirebase();
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
                ClearLoginInputFieldText();
            }

            user = auth.CurrentUser;

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
                    failedMessage += "your email has not been registered. Would you like to register instead?";
                    break;
                case AuthError.WrongPassword:
                    failedMessage += "of incorrect password.";
                    break;
                case AuthError.MissingEmail:
                    failedMessage += "your email is not formatted correctly.";
                    break;
                case AuthError.MissingPassword:
                    failedMessage += "your password is not formatted correctly.";
                    break;
                default:
                    failedMessage = "Login failed. Please make sure you're connected to the internet.";
                    break;
            }

            loginErrorText.text = failedMessage;
        }
        else
        {
            user = loginTask.Result.User;

            authCanvas.Login();
            yield return new WaitForSeconds(.5f);
            CheckUserConfig(isFinished => {
                if (isFinished)
                    SceneManager.LoadScene("MainAppScene");
                else
                    SceneManager.LoadScene("UserConfigScene");
            });
            References.userName = user.DisplayName;
            //UnityEngine.SceneManagement.SceneManager.LoadScene("GameScene");
        }
    }

    public void Register()
    {
        StartCoroutine(RegisterAsync(emailRegisterField.text, passwordRegisterField.text, confirmPasswordRegisterField.text));
    }

    private IEnumerator RegisterAsync(string email, string password, string confirmPassword)
    {
        if (email == "")
        {
            registerErrorText.text = "Email field is empty!";
        }
        else if (passwordRegisterField.text != confirmPasswordRegisterField.text)
        {
            registerErrorText.text = "Passwords do not match!";
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

                string failedMessage = "Registration Failed! Because ";

                switch (authError)
                {
                    case AuthError.InvalidEmail:
                        failedMessage += "your email is not formatted correctly.";
                        break;
                    case AuthError.WrongPassword:
                        failedMessage += "of an incorrect password.";
                        break;
                    case AuthError.MissingEmail:
                        failedMessage += "your email is not formatted correctly.";
                        break;
                    case AuthError.MissingPassword:
                        failedMessage += "your password is not formatted correctly.";
                        break;
                    default:
                        failedMessage = "Registration failed. Please make sure you're connected to the internet.";
                        break;
                }

                registerErrorText.text = failedMessage;

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


                    string failedMessage = "Profile update failed! Because ";

                    switch (authError)
                    {
                        case AuthError.InvalidEmail:
                            failedMessage += "your email is not formatted correctly.";
                            break;
                        case AuthError.WrongPassword:
                            failedMessage += "of an incorrect password.";
                            break;
                        case AuthError.MissingEmail:
                            failedMessage += "your email is not formatted correctly.";
                            break;
                        case AuthError.MissingPassword:
                            failedMessage += "your password is not formatted correctly.";
                            break;
                        default:
                            failedMessage = "Profile update failed. Please make sure you're connected to the internet.";
                            break;
                    }

                    registerErrorText.text = failedMessage;
                }
                else
                {
                    GameObject.Find("FirebaseDBManager").GetComponent<FirebaseDBManager>().CreateUserAuthData(email,user);
                    //UIManager.Instance.OpenLoginPanel();loadingScreen.SetActive(false);

                    authCanvas.Registered();
                    yield return new WaitForSeconds(.5f);
                    CheckUserConfig(isFinished => {
                        if (isFinished)
                            SceneManager.LoadScene("MainAppScene");
                        else 
                            SceneManager.LoadScene("UserConfigScene");
                    });
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
            loadingScreen.SetActive(false);
        }
    }
    public void SwitchScreens(int num)
    {
        if(num == 0)
        {
            authCanvas.RedirectToLogin();
        }

        if (num == 1)
        {
            authCanvas.RedirectToRegister();
        }
        if (num == 2)
        {
            registerScreen.SetActive(false);
            loginScreen.SetActive(false);
        }
    }
    private void OnLoginCompleted(object sender, EventArgs e)
    {

    }
    public void CheckUserConfig(Action<bool> callback)
    {
        DocumentReference docRef = db.Collection("userInfo").Document(user.UserId);
        docRef.GetSnapshotAsync().ContinueWithOnMainThread(task =>
        {
            bool result = false;
            if (task.IsCompleted && !task.IsFaulted)
            {
                var snapshot = task.Result;
                if (snapshot.Exists && snapshot.ContainsField("UserConfig"))
                {
                    result = snapshot.GetValue<bool>("UserConfig");
                }
            }
            callback?.Invoke(result);
        });
    }

}