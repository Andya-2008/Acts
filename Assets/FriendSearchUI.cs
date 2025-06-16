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
    public Button searchButton;
    public TMP_Text resultText;
    public Button sendRequestButton;

    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private string foundUserId = null;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        searchButton.onClick.AddListener(OnSearchClicked);
        sendRequestButton.onClick.AddListener(OnSendRequestClicked);
        sendRequestButton.interactable = false;
    }

    private async void OnSearchClicked()
    {
        string query = inputField.text.Trim().ToLower();
        if (string.IsNullOrEmpty(query)) return;

        QuerySnapshot snapshot = await db.Collection("userInfo")
            .WhereEqualTo("email", query)
            .GetSnapshotAsync();

        // If no match on email, try username
        if (snapshot.Count == 0)
        {
            snapshot = await db.Collection("userInfo")
                .WhereEqualTo("username", query)
                .GetSnapshotAsync();
        }

        if (snapshot.Count == 0)
        {
            resultText.text = "User not found.";
            foundUserId = null;
            sendRequestButton.interactable = false;
        }
        else
        {
            foreach (DocumentSnapshot doc in snapshot.Documents)
            {
                foundUserId = doc.Id;
                string name = doc.Contains("first") ? doc.GetValue<string>("first") : "Unknown";
                resultText.text = $"Found: {name}";
                sendRequestButton.interactable = true;
                break; // Take the first match
            }
        }
    }

    private async void OnSendRequestClicked()
    {
        if (foundUserId == null) return;

        var friendManager = FindObjectOfType<FriendManager>();
        if (friendManager != null)
        {
            await friendManager.SendFriendRequest(foundUserId);
            resultText.text = "✅ Friend request sent!";
            sendRequestButton.interactable = false;
        }
    }
}
