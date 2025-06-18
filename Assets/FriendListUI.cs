using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;
using System.Collections;
using UnityEngine.Networking;

public class FriendListUI : MonoBehaviour
{
    public GameObject friendItemPrefab;
    public Transform friendListContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        LoadFriends();
    }

    public async void LoadFriends()
    {
        foreach (Transform child in friendListContainer)
        {
            Destroy(child.gameObject);
        }

        string myUserId = auth.CurrentUser.UserId;
        var friendsSnap = await db.Collection("userInfo").Document(myUserId)
            .Collection("friends")
            .GetSnapshotAsync();

        foreach (var doc in friendsSnap.Documents)
        {
            string friendId = doc.Id;
            GameObject go = Instantiate(friendItemPrefab, friendListContainer);

            // Load friend info
            var userDoc = await db.Collection("userInfo").Document(friendId).GetSnapshotAsync();

            string first = userDoc.TryGetValue<string>("First", out var f) ? f : "";
            string last = userDoc.TryGetValue<string>("Last", out var l) ? l : "";
            string displayName = $"{first} {last}".Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = userDoc.TryGetValue<string>("Username", out var uname) ? uname : friendId;
            }

            go.transform.Find("NameText").GetComponent<TMP_Text>().text = displayName;

            if (userDoc.TryGetValue<string>("profilePicUrl", out var picUrl))
            {
                RawImage img = go.transform.Find("ProfileImage").GetComponent<RawImage>();
                StartCoroutine(LoadProfileImage(picUrl, img));
            }

            Button unfriendBtn = go.transform.Find("UnfriendButton").GetComponent<Button>();
            unfriendBtn.onClick.AddListener(async () => {
                await UnfriendUser(friendId);
                LoadFriends();
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
                Debug.LogWarning("Failed to load profile picture: " + request.error);
            }
        }
    }

    private async Task UnfriendUser(string friendId)
    {
        string myUserId = auth.CurrentUser.UserId;

        var myFriendRef = db.Collection("userInfo").Document(myUserId)
            .Collection("friends").Document(friendId);
        var theirFriendRef = db.Collection("userInfo").Document(friendId)
            .Collection("friends").Document(myUserId);

        await myFriendRef.DeleteAsync();
        await theirFriendRef.DeleteAsync();

        Debug.Log($"❌ Unfriended user {friendId}");
    }
}
