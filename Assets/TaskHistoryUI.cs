using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;
using System;

public class TaskHistoryUI : MonoBehaviour
{
    public GameObject taskHistoryItemPrefab;
    public Transform historyContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        LoadTaskHistory();
    }

    public async void LoadTaskHistory()
    {
        foreach (Transform child in historyContainer)
            Destroy(child.gameObject);

        string userId = auth.CurrentUser.UserId;
        var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory");
        var snapshot = await historyRef.GetSnapshotAsync();

        // Prevent continuation if this MonoBehaviour was destroyed
        if (this == null) return;

        foreach (var doc in snapshot.Documents)
        {
            var data = doc.ToDictionary();

            GameObject item = Instantiate(taskHistoryItemPrefab, historyContainer);
            string textShort = data.ContainsKey("textShort") ? data["textShort"].ToString() : "No Task Text";
            item.transform.Find("TaskText").GetComponent<TMP_Text>().text = textShort;

            string difficulty = data.ContainsKey("difficulty") ? data["difficulty"].ToString() : "?";
            item.transform.Find("DifficultyText").GetComponent<TMP_Text>().text = $"Difficulty: {difficulty}";

            if (data.ContainsKey("completedAt"))
            {
                Timestamp completedAt = (Timestamp)data["completedAt"];
                string formattedDate = completedAt.ToDateTime().ToLocalTime().ToString("g");
                item.transform.Find("CompletedAtText").GetComponent<TMP_Text>().text = formattedDate;
            }

            // Load image if available
            if (data.ContainsKey("photoUrl"))
            {
                string url = data["photoUrl"].ToString();
                RawImage img = item.transform.Find("TaskImage").GetComponent<RawImage>();
                if (img != null && this != null) // extra safety
                    StartCoroutine(LoadImage(url, img));
            }
        }
    }

    private IEnumerator LoadImage(string url, RawImage image)
    {
        if (string.IsNullOrEmpty(url) || !Uri.IsWellFormedUriString(url, UriKind.Absolute))
        {
            Debug.LogWarning("Invalid or missing image URL: " + url);
            image.gameObject.SetActive(false);
            yield break;
        }

        UnityWebRequest req = UnityWebRequestTexture.GetTexture(url);
        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            image.texture = ((DownloadHandlerTexture)req.downloadHandler).texture;
            image.gameObject.SetActive(true);
        }
        else
        {
            Debug.LogWarning("Image load failed: " + req.error);
            image.gameObject.SetActive(false);
        }
    }
}