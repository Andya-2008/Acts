using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;
using UnityEngine.Networking;
using Firebase.Extensions;
using System.Collections;

public class DeedFeedUI : MonoBehaviour
{
    public GameObject deedItemPrefab;
    public Transform deedContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        LoadDeeds();
    }

    public async void LoadDeeds()
    {
        if (this == null || gameObject == null)
            return;

        foreach (Transform child in deedContainer)
            Destroy(child.gameObject);

        string userId = auth.CurrentUser.UserId;
        Query query = db.Collection("deeds").OrderByDescending("timestamp");
        QuerySnapshot snapshot = await query.GetSnapshotAsync();

        foreach (DocumentSnapshot doc in snapshot.Documents)
        {
            if (this == null || gameObject == null)
                break;

            Dictionary<string, object> data = doc.ToDictionary();
            if (!data.ContainsKey("userId") || data["userId"].ToString() != userId) continue;

            GameObject deedGO = Instantiate(deedItemPrefab, deedContainer);
            deedGO.transform.Find("UsernameText").GetComponent<TMP_Text>().text = data.ContainsKey("username") ? data["username"].ToString() : "Unknown";
            deedGO.transform.Find("PromptText").GetComponent<TMP_Text>().text = data.ContainsKey("prompt") ? data["prompt"].ToString() : "";

            string photoUrl = data.ContainsKey("photoUrl") ? data["photoUrl"].ToString() : null;
            if (!string.IsNullOrEmpty(photoUrl))
                StartCoroutine(LoadImage(photoUrl, deedGO.transform.Find("PhotoImage")?.GetComponent<RawImage>()));

            string profilePicUrl = data.ContainsKey("profilePicUrl") ? data["profilePicUrl"].ToString() : null;
            if (!string.IsNullOrEmpty(profilePicUrl))
                StartCoroutine(LoadImage(profilePicUrl, deedGO.transform.Find("ProfileImage")?.GetComponent<RawImage>()));

            var deedRef = db.Collection("deeds").Document(doc.Id);
            Dictionary<string, object> reactions = new Dictionary<string, object>();
            Dictionary<string, object> userReactions = new Dictionary<string, object>();

            if (data.ContainsKey("reactions") && data["reactions"] is Dictionary<string, object> rawReactions)
                reactions = new Dictionary<string, object>(rawReactions);

            if (data.ContainsKey("userReactions") && data["userReactions"] is Dictionary<string, object> rawUserReactions)
                userReactions = new Dictionary<string, object>(rawUserReactions);

            Debug.Log("📥 Loaded reactions: " + string.Join(", ", reactions));

            AddReactionListeners(deedGO, deedRef, reactions, userReactions);
        }
    }

    private void AddReactionListeners(GameObject deedGO, DocumentReference deedRef, Dictionary<string, object> reactions, Dictionary<string, object> userReactions)
    {
        TMP_Text likeText = deedGO.transform.Find("LikeButton/LikeCountText")?.GetComponent<TMP_Text>();
        TMP_Text heartText = deedGO.transform.Find("HeartButton/HeartCountText")?.GetComponent<TMP_Text>();
        TMP_Text hugText = deedGO.transform.Find("HugButton/HugCountText")?.GetComponent<TMP_Text>();
        TMP_Text wowText = deedGO.transform.Find("WowButton/WowCountText")?.GetComponent<TMP_Text>();

        Button likeBtn = deedGO.transform.Find("LikeButton")?.GetComponent<Button>();
        Button heartBtn = deedGO.transform.Find("HeartButton")?.GetComponent<Button>();
        Button hugBtn = deedGO.transform.Find("HugButton")?.GetComponent<Button>();
        Button wowBtn = deedGO.transform.Find("WowButton")?.GetComponent<Button>();

        Debug.Log("💬 Setting counts. Like: " + GetReactionCount(reactions, "like") + ", Heart: " + GetReactionCount(reactions, "heart") + ", Hug: " + GetReactionCount(reactions, "hug") + ", Wow: " + GetReactionCount(reactions, "wow"));

        if (likeText != null) likeText.text = GetReactionCount(reactions, "like");
        if (heartText != null) heartText.text = GetReactionCount(reactions, "heart");
        if (hugText != null) hugText.text = GetReactionCount(reactions, "hug");
        if (wowText != null) wowText.text = GetReactionCount(reactions, "wow");

        string userId = auth.CurrentUser.UserId;

        HighlightUserReaction(likeBtn, userReactions, userId, "like");
        HighlightUserReaction(heartBtn, userReactions, userId, "heart");
        HighlightUserReaction(hugBtn, userReactions, userId, "hug");
        HighlightUserReaction(wowBtn, userReactions, userId, "wow");

        if (likeBtn != null) likeBtn.onClick.AddListener(() => SetUserReaction(deedRef, userId, "like"));
        if (heartBtn != null) heartBtn.onClick.AddListener(() => SetUserReaction(deedRef, userId, "heart"));
        if (hugBtn != null) hugBtn.onClick.AddListener(() => SetUserReaction(deedRef, userId, "hug"));
        if (wowBtn != null) wowBtn.onClick.AddListener(() => SetUserReaction(deedRef, userId, "wow"));
    }

    private void HighlightUserReaction(Button button, Dictionary<string, object> userReactions, string userId, string reactionType)
    {
        if (userReactions.TryGetValue(userId, out object userReaction) && userReaction.ToString() == reactionType)
        {
            var colors = button.colors;
            colors.normalColor = Color.yellow;
            button.colors = colors;
        }
    }

    private void SetUserReaction(DocumentReference deedRef, string userId, string reactionType)
    {
        deedRef.GetSnapshotAsync().ContinueWithOnMainThread(task =>
        {
            if (task.IsCompleted && task.Result.Exists)
            {
                var data = task.Result.ToDictionary();

                Dictionary<string, object> userReactions = data.ContainsKey("userReactions") && data["userReactions"] is Dictionary<string, object> ur ? ur : new Dictionary<string, object>();
                string prevReaction = userReactions.ContainsKey(userId) ? userReactions[userId].ToString() : null;

                var updates = new Dictionary<string, object>();

                if (prevReaction == reactionType) return; // no-op if same

                if (!string.IsNullOrEmpty(prevReaction))
                    updates[$"reactions.{prevReaction}"] = FieldValue.Increment(-1);

                updates[$"reactions.{reactionType}"] = FieldValue.Increment(1);
                updates[$"userReactions.{userId}"] = reactionType;

                deedRef.UpdateAsync(updates).ContinueWithOnMainThread(updateTask =>
                {
                    if (updateTask.IsCompleted)
                    {
                        Debug.Log("✅ Reaction updated to: " + reactionType);
                        LoadDeeds();
                    }
                });
            }
        });
    }

    private string GetReactionCount(Dictionary<string, object> reactions, string key)
    {
        try
        {
            if (reactions != null && reactions.TryGetValue(key, out object value))
            {
                Debug.Log($"🔍 {key} value raw: {value}, type: {value?.GetType()}");
                if (value is long longVal) return longVal.ToString();
                if (value is int intVal) return intVal.ToString();
                if (int.TryParse(value.ToString(), out int parsed)) return parsed.ToString();
            }
        }
        catch (System.Exception ex)
        {
            Debug.LogError($"❌ Error parsing reaction count for '{key}': {ex.Message}");
        }
        return "0";
    }

    private IEnumerator LoadImage(string url, RawImage image)
    {
        if (image == null)
            yield break;

        UnityWebRequest request = UnityWebRequestTexture.GetTexture(url);
        yield return request.SendWebRequest();

        if (request.result == UnityWebRequest.Result.Success)
        {
            image.texture = ((DownloadHandlerTexture)request.downloadHandler).texture;
            image.gameObject.SetActive(true);
        }
        else
        {
            Debug.LogWarning("Failed to load image: " + request.error);
            image.gameObject.SetActive(false);
        }
    }
}
