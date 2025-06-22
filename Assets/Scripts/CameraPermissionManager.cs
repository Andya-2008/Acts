
using UnityEngine;
#if UNITY_ANDROID
using UnityEngine.Android;
#endif
#if UNITY_IOS
using UnityEngine.iOS;
#endif

public class CameraPermissionManager : MonoBehaviour
{
    // You can use these booleans to check the permission status
    public bool cameraPermissionGranted = false;
    public bool permissionCheckComplete = false;

    void Start()
    {

    }

    public void RequestCameraPermission()
    {
        permissionCheckComplete = false;

#if UNITY_ANDROID
        // Android specific permission request
        if (!Permission.HasUserAuthorizedPermission(Permission.Camera))
        {
            PermissionCallbacks callbacks = new PermissionCallbacks();
            callbacks.PermissionGranted += PermissionCallbacks_PermissionGranted;
            callbacks.PermissionDenied += PermissionCallbacks_PermissionDenied;

            Permission.RequestUserPermission(Permission.Camera, callbacks);
        }
        else
        {
            // Permission already granted
            cameraPermissionGranted = true;
            permissionCheckComplete = true;
        }
#elif UNITY_IOS
        // iOS and WebGL specific permission request
        if (!Application.HasUserAuthorization(UserAuthorization.WebCam))
        {
            Application.RequestUserAuthorization(UserAuthorization.WebCam);
            // On iOS/WebGL, you might need to check in Update or with a coroutine
            // if permission has been granted after the request
            StartCoroutine(CheckiOSWebGLCameraPermission());
        }
        else
        {
            // Permission already granted
            cameraPermissionGranted = true;
            permissionCheckComplete = true;
        }
#else
        // Other platforms - assuming camera access is available or not applicable
        cameraPermissionGranted = true;
        permissionCheckComplete = true;
#endif
    }

    // Android permission callback methods
#if UNITY_ANDROID
    internal void PermissionCallbacks_PermissionGranted(string permissionName)
    {
        cameraPermissionGranted = true;
        permissionCheckComplete = true;
    }

    internal void PermissionCallbacks_PermissionDenied(string permissionName)
    {
        cameraPermissionGranted = false;
        permissionCheckComplete = true;
        // Handle permission denial, e.g., display a message to the user
    }

    internal void PermissionCallbacks_PermissionDeniedAndDontAskAgain(string permissionName)
    {
        cameraPermissionGranted = false;
        permissionCheckComplete = true;
        // Handle scenario where the user has permanently denied permission
        // You might need to instruct the user to change settings manually
    }
#endif

    // Coroutine to check iOS/WebGL permission
#if UNITY_IOS || UNITY_WEBGL
    private System.Collections.IEnumerator CheckiOSWebGLCameraPermission()
    {
        // Wait for permission to be granted
        while (!Application.HasUserAuthorization(UserAuthorization.WebCam))
        {
            yield return null;
        }
        cameraPermissionGranted = true;
        permissionCheckComplete = true;
    }
#endif
}