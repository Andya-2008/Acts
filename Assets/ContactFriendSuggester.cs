using UnityEngine;
using Firebase.Firestore;
using Firebase.Auth;
using Firebase.Extensions;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using BrainCheck;

public class ContactFriendSuggester : MonoBehaviour
{
    public Transform suggestedContainer;
    public GameObject suggestedFriendPrefab;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    private void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
    }

    public void CheckContactsForFriends()
    {
        /*var contactList = UnityReceiveMessages.Instance?.contactList;
        if (contactList == null || contactList.Count == 0)
        {
            Debug.LogWarning("No contacts found.");
            return;
        }

        foreach (var contact in contactList)
        {
            string normalizedPhone = NormalizePhone(contact.getNumber());
            if (string.IsNullOrEmpty(normalizedPhone)) continue;

            Query query = db.Collection("userInfo").WhereEqualTo("Phone", normalizedPhone);
            query.GetSnapshotAsync().ContinueWithOnMainThread(task =>
            {
                if (!task.IsCompleted || task.Result.Count == 0) return;

                foreach (var doc in task.Result.Documents)
                {
                    string targetUserId = doc.Id;
                    string username = doc.ContainsField("Username") ? doc.GetValue<string>("Username") : "Unknown";

                    CreateSuggestedFriendUI(username, contact.getName(), targetUserId);
                }
            });
        }
        */
    }

    string NormalizePhone(string raw)
    {
        if (string.IsNullOrEmpty(raw)) return "";
        return Regex.Replace(raw, @"[^0-9]", "");
    }

    void CreateSuggestedFriendUI(string username, string contactName, string targetUserId)
    {
        GameObject go = Instantiate(suggestedFriendPrefab, suggestedContainer);
        go.transform.Find("UsernameText").GetComponent<TMP_Text>().text = username;
        go.transform.Find("ContactNameText").GetComponent<TMP_Text>().text = $"In your contacts as: {contactName}";

        Button addButton = go.transform.Find("AddFriendButton").GetComponent<Button>();
        addButton.onClick.AddListener(() =>
        {
            SendFriendRequest(targetUserId);
            addButton.interactable = false;
            addButton.transform.Find("Text").GetComponent<TMP_Text>().text = "Request Sent";
        });
    }

    void SendFriendRequest(string targetUserId)
    {
        string myUserId = auth.CurrentUser.UserId;
        var sentRef = db.Collection("userInfo").Document(myUserId).Collection("friendRequestsSent").Document(targetUserId);
        var receivedRef = db.Collection("userInfo").Document(targetUserId).Collection("friendRequestsReceived").Document(myUserId);

        Dictionary<string, object> request = new Dictionary<string, object> { { "status", "pending" } };
        sentRef.SetAsync(request);
        receivedRef.SetAsync(request);
    }
}