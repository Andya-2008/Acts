using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;
using System.Collections;
using UnityEngine.Networking;

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

            // Fetch sender info
            var userDoc = await db.Collection("userInfo").Document(senderId).GetSnapshotAsync();
            string first = userDoc.TryGetValue<string>("first", out var f) ? f : "";
            string last = userDoc.TryGetValue<string>("last", out var l) ? l : "";
            string displayName = $"{first} {last}".Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = userDoc.TryGetValue<string>("Username", out var uname) ? uname : senderId;
            }
            go.transform.Find("NameText").GetComponent<TMP_Text>().text = displayName;

            // Set profile image if available
            if (userDoc.TryGetValue<string>("profilePicUrl", out var picUrl))
            {
                RawImage image = go.transform.Find("ProfileImage").GetComponent<RawImage>();
                StartCoroutine(LoadProfileImage(picUrl, image));
            }

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
        }
    }

    private IEnumerator LoadProfileImage(string url, RawImage image)
    {
        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(url))
        {
            yield return request.SendWebRequest();

            if (request.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = ((DownloadHandlerTexture)request.downloadHandler).texture;
                image.texture = texture;
            }
            else
            {
                Debug.LogWarning($"Failed to load profile image: {request.error}");
            }
        }
    }
}