using System.Collections.Generic;
using Sych.ShareAssets.Runtime;
using UnityEngine;
using Firebase.Auth;

public class InviteFriend : MonoBehaviour
{
    private FirebaseAuth auth;

    [TextArea]
    public string messageTemplate = "Try this app with me! 👉 {link}";

    public string baseUrl = "https://yourapp.com";

    private void Awake()
    {
        auth = FirebaseAuth.DefaultInstance;
    }

    public void Invite()
    {
        if (!Share.IsPlatformSupported)
        {
            Debug.LogError("Sharing not supported on this platform.");
            return;
        }

        string userId = auth?.CurrentUser?.UserId;
        if (string.IsNullOrEmpty(userId))
        {
            Debug.LogError("User not authenticated.");
            return;
        }

        // Add referral ID to link
        string referralLink = $"{baseUrl}?ref={userId}";
        string finalMessage = messageTemplate.Replace("{link}", referralLink);

        var shareItems = new List<string> { finalMessage };

        Share.Items(shareItems, success =>
        {
            Debug.Log(success ? "✅ Invite sent successfully!" : "❌ Invite canceled.");
        });
    }
}