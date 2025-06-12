using UnityEngine;
#if UNITY_ANDROID
using UnityEngine.Android;
#endif

public class CameraPermissionManager : MonoBehaviour
{
    void Start()
    {

    }

    public void RequestCameraPermission()
    {
#if UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission(Permission.Camera))
        {
            Permission.RequestUserPermission(Permission.Camera);
        }
#elif UNITY_IOS
        // iOS automatically prompts the first time camera is accessed.
        // You just need to provide a usage description (see next step).
        Debug.Log("iOS will request camera permission automatically when used.");
#endif
    }
}