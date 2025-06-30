using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Auth;
using Firebase.Firestore;
using Firebase.Extensions;
using System.Collections.Generic;
using UnityEngine.Networking;
using System.Collections;
using System.Threading.Tasks;
using System.Linq;
using System;

public class ProfilePageUI : MonoBehaviour
{
    public TMP_Text usernameText;
    public RawImage profileImage;
    public TMP_Text traitsText;
    public TMP_Text completedCountText;
    public TMP_Text streakText;

    private FirebaseAuth auth;
    private FirebaseFirestore db;

    public GameObject recentTaskItemPrefab;
    public Transform recentTasksContainer;
    public Texture2D defaultTaskTexture;

    public GameObject loadingTaskItemPrefab;


    void Start()
    {
        auth = FirebaseAuth.DefaultInstance;
        db = FirebaseFirestore.DefaultInstance;
    }

    public void LoadProfile()
    {
        string userId = auth.CurrentUser.UserId;
        var userDocRef = db.Collection("userInfo").Document(userId);

        userDocRef.GetSnapshotAsync().ContinueWithOnMainThread(task =>
        {
            if (task.IsCompleted && task.Result.Exists)
            {
                var data = task.Result.ToDictionary();

                string username = data.ContainsKey("Username") ? data["Username"].ToString() : "User";
                usernameText.text = username;

                if (data.TryGetValue("profilePicUrl", out object profilePicUrlObj) && profilePicUrlObj is string profilePicUrl)
                {
                    StartCoroutine(LoadImage(profilePicUrl, profileImage));
                }

                if (data.TryGetValue("Traits", out object traitsObj) && traitsObj is List<object> traitsList)
                {
                    traitsText.text = "Traits: " + string.Join(", ", traitsList);
                }
                else
                {
                    traitsText.text = "Traits: None";
                }

                LoadTaskStats(userId);

                var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory")
    .OrderByDescending("completedAt").Limit(3);

                historyRef.GetSnapshotAsync().ContinueWithOnMainThread(historyTask =>
                {
                    if (historyTask.IsCompleted && historyTask.Result != null)
                    {
                        DisplayRecentTasks(historyTask.Result.Documents.ToList());
                    }
                });
            }
        });
    }

    private void LoadTaskStats(string userId)
    {
        db.Collection("userInfo").Document(userId).Collection("taskHistory").GetSnapshotAsync()
     .ContinueWithOnMainThread((Task<QuerySnapshot> task) =>
     {
         if (task.IsCompletedSuccessfully)
         {
             var docs = task.Result.Documents;
             completedCountText.text = "Tasks Completed: " + docs.Count();

             int streak = CalculateStreak(docs.ToList());
             streakText.text = "Streak: " + streak + " day" + (streak == 1 ? "" : "s");
         }
     });
    }

    int CalculateStreak(List<DocumentSnapshot> docs)
    {
        HashSet<DateTime> uniqueDates = new HashSet<DateTime>();

        foreach (var doc in docs)
        {
            if (doc.ContainsField("completedAt"))
            {
                Timestamp ts = doc.GetValue<Timestamp>("completedAt");
                DateTime localDate = ts.ToDateTime().ToLocalTime().Date;
                uniqueDates.Add(localDate);
            }
        }

        if (uniqueDates.Count == 0)
            return 0;

        int streak = 0;
        DateTime checkDate = DateTime.Now.Date;

        // If today is not completed, we still check yesterday, etc.
        if (!uniqueDates.Contains(checkDate))
        {
            checkDate = checkDate.AddDays(-1);
        }

        while (uniqueDates.Contains(checkDate))
        {
            streak++;
            checkDate = checkDate.AddDays(-1);
        }

        return streak;
    }

    private IEnumerator LoadImage(string url, RawImage image)
    {
        UnityWebRequest request = UnityWebRequestTexture.GetTexture(url);
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            image.texture = ((DownloadHandlerTexture)request.downloadHandler).texture;
            image.gameObject.SetActive(true);
        }
        else
        {
            Debug.LogWarning("Failed to load profile image: " + request.error);
            image.gameObject.SetActive(false);
        }
    }

    async void DisplayRecentTasks(IReadOnlyList<DocumentSnapshot> docs)
    {
        // Clear any old items
        foreach (Transform child in recentTasksContainer)
            Destroy(child.gameObject);

        // Show loading placeholders
        List<GameObject> loadingPlaceholders = new List<GameObject>();
        for (int i = 0; i < 3; i++)
        {
            GameObject placeholder = Instantiate(loadingTaskItemPrefab, recentTasksContainer);
            placeholder.SetActive(true);
            loadingPlaceholders.Add(placeholder);
        }

        // Begin loading real data...
        int count = Mathf.Min(docs.Count, 3);
        HashSet<string> seenTexts = new HashSet<string>();
        List<GameObject> finalTaskItems = new List<GameObject>();
        int shown = 0;

        foreach (var doc in docs)
        {
            if (!doc.Exists) continue;

            string text = doc.ContainsField("textShort") ? doc.GetValue<object>("textShort").ToString() : "Unknown";
            if (seenTexts.Contains(text)) continue;

            seenTexts.Add(text);
            shown++;
            if (shown > 3) break;

            string difficulty = doc.ContainsField("difficulty") ? doc.GetValue<object>("difficulty").ToString() : "Unknown";
            Timestamp? completedAt = doc.ContainsField("completedAt") ? doc.GetValue<Timestamp>("completedAt") : (Timestamp?)null;
            string timeAgo = completedAt.HasValue ? FormatRelativeTime(completedAt.Value.ToDateTime()) : "Unknown date";

            GameObject item = Instantiate(recentTaskItemPrefab);
            item.SetActive(false); // Don’t show it yet
            finalTaskItems.Add(item);

            item.transform.Find("TaskText")?.GetComponent<TMP_Text>()?.SetText(text);
            item.transform.Find("DifficultyText")?.GetComponent<TMP_Text>()?.SetText($"Difficulty: {difficulty}");
            item.transform.Find("DateText")?.GetComponent<TMP_Text>()?.SetText(timeAgo);

            RawImage image = item.transform.Find("TaskImage")?.GetComponent<RawImage>();
            string userId = auth.CurrentUser.UserId;
            string taskId = doc.Id;

            if (image != null && image.gameObject != null)
            {
                var photoDoc = await db.Collection("userInfo").Document(userId)
                    .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();

                string imageUrl = photoDoc.Exists && photoDoc.ContainsField("url") ? photoDoc.GetValue<string>("url") : null;
                Texture textureToApply = defaultTaskTexture;

                if (!string.IsNullOrEmpty(imageUrl))
                {
                    UnityWebRequest req = UnityWebRequestTexture.GetTexture(imageUrl);
                    await req.SendWebRequest();

                    if (req.result == UnityWebRequest.Result.Success)
                    {
                        var downloadedTex = ((DownloadHandlerTexture)req.downloadHandler).texture;
                        if (downloadedTex != null)
                            textureToApply = downloadedTex;
                    }
                }

                image.texture = textureToApply;
            }
        }

        // All loading is complete: remove placeholders
        foreach (var placeholder in loadingPlaceholders)
            Destroy(placeholder);

        // Add final tasks to UI
        foreach (var item in finalTaskItems)
        {
            item.transform.SetParent(recentTasksContainer, false);
            item.SetActive(true);
        }

        // If no tasks shown
        if (docs.Count == 0 || shown == 0)
        {
            GameObject item = Instantiate(recentTaskItemPrefab, recentTasksContainer);
            item.SetActive(true);
            item.transform.Find("TaskText")?.GetComponent<TMP_Text>()?.SetText("No recent tasks yet!");
            item.transform.Find("DifficultyText")?.gameObject.SetActive(false);
            item.transform.Find("DateText")?.gameObject.SetActive(false);
        }
    }

    string FormatRelativeTime(DateTime dateTime)
    {
        DateTime now = DateTime.UtcNow;
        TimeSpan difference = now.Date - dateTime.Date;

        int daysAgo = (int)difference.TotalDays;

        if (daysAgo == 0) return "Today";
        if (daysAgo == 1) return "1 day ago";
        if (daysAgo <= 7) return $"{daysAgo} days ago";

        return dateTime.ToString("MMM d, yyyy"); // e.g. "Jun 29, 2025"
    }
}