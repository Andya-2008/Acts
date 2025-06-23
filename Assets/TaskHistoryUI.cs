using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using UnityEngine.Networking;
using System.Collections;
using System.Collections.Generic;

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
                StartCoroutine(LoadImage(url, img));
            }
        }
    }

    private IEnumerator LoadImage(string url, RawImage image)
    {
        UnityWebRequest req = UnityWebRequestTexture.GetTexture(url);
        yield return req.SendWebRequest();

        if (req.result == UnityWebRequest.Result.Success)
        {
            image.texture = ((DownloadHandlerTexture)req.downloadHandler).texture;
            image.gameObject.SetActive(true);
        }
        else
        {
            image.gameObject.SetActive(false);
        }
    }
}