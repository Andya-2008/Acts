using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;
using System.Collections;
using UnityEngine.Networking;
using System.IO;
using System;
using System.Security.Cryptography;
using System.Linq;

public class FriendRequestInboxUI : MonoBehaviour
{
    public GameObject requestItemPrefab;
    public Transform requestContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private Dictionary<string, Texture2D> imageCache = new Dictionary<string, Texture2D>();
    private string cacheDir;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
        cacheDir = Path.Combine(Application.persistentDataPath, "ProfileImageCache");
        if (!Directory.Exists(cacheDir)) Directory.CreateDirectory(cacheDir);

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

        List<(string senderId, string displayName, string picUrl)> requestData = new List<(string, string, string)>();

        foreach (var doc in requestSnap.Documents)
        {
            string senderId = doc.Id;
            var userDoc = await db.Collection("userInfo").Document(senderId).GetSnapshotAsync();
            string first = userDoc.TryGetValue<string>("First", out var f) ? f : "";
            string last = userDoc.TryGetValue<string>("Last", out var l) ? l : "";
            string displayName = ($"{first} {last}").Trim();
            if (string.IsNullOrWhiteSpace(displayName))
            {
                displayName = userDoc.TryGetValue<string>("Username", out var uname) ? uname : senderId;
            }
            string picUrl = userDoc.TryGetValue<string>("profilePicUrl", out var purl) ? purl : null;
            requestData.Add((senderId, displayName, picUrl));
        }

        foreach (var (senderId, displayName, picUrl) in requestData.OrderBy(r => r.displayName))
        {
            GameObject go = Instantiate(requestItemPrefab, requestContainer);
            go.transform.Find("NameText").GetComponent<TMP_Text>().text = displayName;

            if (!string.IsNullOrEmpty(picUrl))
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
        if (imageCache.ContainsKey(url))
        {
            image.texture = imageCache[url];
            yield break;
        }

        string safeFileName = HashUrlToFileName(url);
        string filePath = Path.Combine(cacheDir, safeFileName + ".png");

        if (File.Exists(filePath))
        {
            byte[] bytes = File.ReadAllBytes(filePath);
            Texture2D cachedTex = new Texture2D(2, 2);
            cachedTex.LoadImage(bytes);
            image.texture = cachedTex;
            imageCache[url] = cachedTex;
            yield break;
        }

        using (UnityWebRequest request = UnityWebRequestTexture.GetTexture(url))
        {
            yield return request.SendWebRequest();
            if (request.result == UnityWebRequest.Result.Success)
            {
                Texture2D texture = ((DownloadHandlerTexture)request.downloadHandler).texture;
                image.texture = texture;
                imageCache[url] = texture;
                try
                {
                    File.WriteAllBytes(filePath, texture.EncodeToPNG());
                }
                catch (IOException e)
                {
                    Debug.LogWarning("Failed to save profile image to cache: " + e.Message);
                }
            }
            else
            {
                Debug.LogWarning("Failed to load profile picture: " + request.error);
            }
        }
    }

    private string HashUrlToFileName(string url)
    {
        using (SHA256 sha256 = SHA256.Create())
        {
            byte[] hashBytes = sha256.ComputeHash(System.Text.Encoding.UTF8.GetBytes(url));
            return BitConverter.ToString(hashBytes).Replace("-", "").ToLower();
        }
    }
}
