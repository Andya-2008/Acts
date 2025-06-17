using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;

public class FriendRequestInboxUI : MonoBehaviour
{
    public GameObject requestItemPrefab;
    public Transform requestContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        LoadRequests();
    }

    public async void LoadRequests()
    {
        foreach (Transform child in requestContainer)
        {
            Destroy(child.gameObject);
        }

        string myUserId = auth.CurrentUser.UserId;
        var requestSnap = await db.Collection("userInfo").Document(myUserId)
            .Collection("friendRequestsReceived")
            .WhereEqualTo("status", "pending")
            .GetSnapshotAsync();

        foreach (var doc in requestSnap.Documents)
        {
            string senderId = doc.Id;
            GameObject go = Instantiate(requestItemPrefab, requestContainer);

            // Fetch sender info (optional)
            var userDoc = await db.Collection("userInfo").Document(senderId).GetSnapshotAsync();
            string first = userDoc.TryGetValue<string>("First", out var f) ? f : "";
            string last = userDoc.TryGetValue<string>("Last", out var l) ? l : "";
            string displayName = $"{first} {last}".Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = userDoc.TryGetValue<string>("Username", out var uname) ? uname : senderId;
            }
            go.transform.Find("NameText").GetComponent<TMP_Text>().text = displayName;

            Button acceptBtn = go.transform.Find("AcceptButton").GetComponent<Button>();
            Button rejectBtn = go.transform.Find("RejectButton").GetComponent<Button>();

            acceptBtn.onClick.AddListener(async () => {
                await FindFirstObjectByType<FriendManager>().AcceptFriendRequest(senderId);
                LoadRequests();
            });

            rejectBtn.onClick.AddListener(async () => {
                await FindFirstObjectByType<FriendManager>().RejectFriendRequest(senderId);
                LoadRequests();
            });

            rejectBtn.onClick.AddListener(async () => {
                await FindFirstObjectByType<FriendManager>().RejectFriendRequest(senderId);
                LoadRequests();
            });
        }
    }
}
