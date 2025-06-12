using System.Collections;
using UnityEngine;
using Firebase;
using Firebase.Messaging;

public class PushNotificationManager : MonoBehaviour
{
    private void Start()
    {

    }

    public void RequestPushPermission()
    {
            FirebaseMessaging.TokenReceived += OnTokenReceived;
            FirebaseMessaging.MessageReceived += OnMessageReceived;

#if UNITY_IOS
            // Request permission on iOS (necessary for notifications to show)
            Firebase.Messaging.FirebaseMessaging.RequestPermissionAsync().ContinueWith(permissionTask => {
                var authStatus = Firebase.Messaging.FirebaseMessaging.AuthorizationStatus;
                Debug.Log("iOS Permission status: " + authStatus);
            });
#endif

            Debug.Log("Firebase Initialized and Push Notifications Ready.");
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