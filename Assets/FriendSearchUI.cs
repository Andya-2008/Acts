// Add this to your project as FriendSearchUI.cs
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;

public class FriendSearchUI : MonoBehaviour
{
    public TMP_InputField inputField; // Can be email or username
    public Button searchAndSendButton;
    public TMP_Text resultText;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        searchAndSendButton.onClick.AddListener(OnSearchAndSendClicked);
    }

    private async void OnSearchAndSendClicked()
    {
        string query = inputField.text.Trim().ToLower();
        if (string.IsNullOrEmpty(query)) return;

        QuerySnapshot snapshot = await db.Collection("userInfo")
            .WhereEqualTo("Email", query)
            .GetSnapshotAsync();

        // If no match on email, try username
        if (snapshot.Count == 0)
        {
            snapshot = await db.Collection("userInfo")
                .WhereEqualTo("Username", query)
                .GetSnapshotAsync();
        }

        if (snapshot.Count == 0)
        {
            resultText.text = "User not found.";
            return;
        }

        foreach (DocumentSnapshot doc in snapshot.Documents)
        {
            string foundUserId = doc.Id;
            string currentUserId = auth.CurrentUser.UserId;
            if (foundUserId == currentUserId)
            {
                resultText.text = "You cannot add yourself as a friend.";
                return;
            }

            string name = doc.TryGetValue<string>("first", out var firstName) ? firstName : "Unknown";

            var friendManager = FindFirstObjectByType<FriendManager>();
            if (friendManager != null)
            {
                await friendManager.SendFriendRequest(foundUserId);
                resultText.text = $"Friend request sent to {name}";
            }
            else
            {
                resultText.text = "Friend manager not found.";
            }
            break;
        }
    }
}
