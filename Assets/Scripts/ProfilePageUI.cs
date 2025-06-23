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

    void Start()
    {
        auth = FirebaseAuth.DefaultInstance;
        db = FirebaseFirestore.DefaultInstance;

        LoadProfile();
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
                // Normalize to local date only
                DateTime localDate = ts.ToDateTime().ToLocalTime().Date;
                uniqueDates.Add(localDate);
            }
        }

        if (uniqueDates.Count == 0)
            return 0;

        int streak = 0;
        DateTime checkDate = DateTime.Now.Date; // Local today

        // Check today, then yesterday, etc.
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
}