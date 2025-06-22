using System.Collections;
using UnityEngine;
using Firebase;
using Firebase.Messaging;
using UnityEngine.Android;

public class PushNotificationManager : MonoBehaviour
{
    private void Start()
    {

    }

    public void RequestPushPermission()
    {
            //FirebaseMessaging.TokenReceived += OnTokenReceived;
            //FirebaseMessaging.MessageReceived += OnMessageReceived;

#if UNITY_IOS
            // Request permission on iOS (necessary for notifications to show)
            Firebase.Messaging.FirebaseMessaging.RequestPermissionAsync().ContinueWith(permissionTask => {
                var authStatus = Firebase.Messaging.FirebaseMessaging.AuthorizationStatus;
            });
#elif UNITY_ANDROID
        if (!Permission.HasUserAuthorizedPermission("android.permission.POST_NOTIFICATIONS"))
        {
            Permission.RequestUserPermission("android.permission.POST_NOTIFICATIONS");
        }
#endif
    }

    // Called when device receives a new FCM registration token
    private void OnTokenReceived(object sender, TokenReceivedEventArgs token)
    {
        Debug.Log("FCM Token: " + token.Token);
        // You can send this token to your backend if needed
    }

    // Called when a message is received
    private void OnMessageReceived(object sender, MessageReceivedEventArgs e)
    {
        Debug.Log("Received a new message from: " + e.Message.From);
        if (e.Message.Notification != null)
        {
            Debug.Log("Title: " + e.Message.Notification.Title);
            Debug.Log("Body: " + e.Message.Notification.Body);
        }
    }
}