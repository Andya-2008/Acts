using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Storage;
using UnityEngine.Networking;

public class DeedFeedUI : MonoBehaviour
{
    public GameObject deedItemPrefab;
    public Transform deedContainer;

    private FirebaseFirestore db;
    private FirebaseStorage storage;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;

        LoadDeeds();
    }

    public async void LoadDeeds()
    {
        QuerySnapshot snapshot = await db.Collection("deeds").OrderByDescending("timestamp").GetSnapshotAsync();

        foreach (Transform child in deedContainer)
            Destroy(child.gameObject);

        foreach (DocumentSnapshot doc in snapshot.Documents)
        {
            Dictionary<string, object> data = doc.ToDictionary();
            GameObject deedGO = Instantiate(deedItemPrefab, deedContainer);

            deedGO.transform.Find("PromptText").GetComponent<TMP_Text>().text = data["prompt"].ToString();
            deedGO.transform.Find("UsernameText").GetComponent<TMP_Text>().text = data.ContainsKey("username") ? data["username"].ToString() : "Unknown";

            // Profile Picture
            string profilePicUrl = data.ContainsKey("profilePicUrl") ? data["profilePicUrl"].ToString() : "";
            if (!string.IsNullOrEmpty(profilePicUrl))
            {
                StartCoroutine(LoadImage(profilePicUrl, deedGO.transform.Find("ProfilePic").GetComponent<RawImage>()));
            }

            // Deed Photo
            string photoUrl = data["photoUrl"].ToString();
            StartCoroutine(LoadImage(photoUrl, deedGO.transform.Find("DeedImage").GetComponent<RawImage>()));

            // Reactions (optional enhancement later)
        }
    }

    private IEnumerator LoadImage(string url, RawImage image)
    {
        UnityWebRequest req = UnityWebRequestTexture.GetTexture(url);
        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            Texture2D tex = DownloadHandlerTexture.GetContent(req);
            image.texture = tex;
            image.gameObject.SetActive(true);
        }
        else
        {
            Debug.LogWarning("Failed to load image from URL: " + url);
            image.gameObject.SetActive(false);
        }
    }
}
