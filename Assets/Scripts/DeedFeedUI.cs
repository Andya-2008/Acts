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
    public GameObject reactionsPopupPrefab;
    public GameObject reactionItemPrefab;
    public Transform deedContainer;
    public Transform popupParent;
    public ScrollRect scrollRect;
    public GameObject popupScreen;
    public float pullThreshold = 100f;

    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private bool isPulling = false;
    private float pullStartY = 0f;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        LoadDeeds();
    }

    void Update()
    {
        if (scrollRect == null || scrollRect.verticalNormalizedPosition < 0.98f)
            return;

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_WEBGL
        if (Input.GetMouseButtonDown(0))
        {
            isPulling = true;
            pullStartY = Input.mousePosition.y;
        }
        else if (Input.GetMouseButtonUp(0) && isPulling)
        {
            float pullDelta = Input.mousePosition.y - pullStartY;
            if (pullDelta > pullThreshold)
            {
                Debug.Log("🔄 Pull-to-refresh triggered!");
                LoadDeeds();
            }
            isPulling = false;
        }
#elif UNITY_IOS || UNITY_ANDROID
        if (Input.touchCount > 0)
        {
            Touch touch = Input.GetTouch(0);

            if (touch.phase == TouchPhase.Began)
            {
                isPulling = true;
                pullStartY = touch.position.y;
            }
            else if (touch.phase == TouchPhase.Ended && isPulling)
            {
                float pullDelta = touch.position.y - pullStartY;
                if (pullDelta > pullThreshold)
                {
                    Debug.Log("🔄 Mobile pull-to-refresh triggered!");
                    LoadDeeds();
                }
                isPulling = false;
            }
        }
#endif
    }

    public async void LoadDeeds()
    {
        if (this == null || gameObject == null)
            return;

        foreach (Transform child in deedContainer)
            Destroy(child.gameObject);

        string userId = auth.CurrentUser.UserId;

        QuerySnapshot friendsSnap = await db.Collection("userInfo").Document(userId).Collection("friends").GetSnapshotAsync();
        HashSet<string> friendsSet = new HashSet<string>();
        foreach (DocumentSnapshot doc in friendsSnap.Documents)
        {
            friendsSet.Add(doc.Id);
        }

        Query query = db.Collection("deeds").OrderByDescending("timestamp");
        QuerySnapshot snapshot = await query.GetSnapshotAsync();

        foreach (DocumentSnapshot doc in snapshot.Documents)
        {
            if (this == null || gameObject == null)
                break;

            Dictionary<string, object> data = doc.ToDictionary();
            if (!data.ContainsKey("userId") || !friendsSet.Contains(data["userId"].ToString())) continue;

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
            Dictionary<string, object> reactions = data.ContainsKey("reactions") && data["reactions"] is Dictionary<string, object> rawReactions ? new Dictionary<string, object>(rawReactions) : new Dictionary<string, object>();
            Dictionary<string, object> userReactions = data.ContainsKey("userReactions") && data["userReactions"] is Dictionary<string, object> rawUserReactions ? new Dictionary<string, object>(rawUserReactions) : new Dictionary<string, object>();

            Debug.Log("📥 Loaded reactions: " + string.Join(", ", reactions));

            AddReactionListeners(deedGO, deedRef, reactions, userReactions);

            // If current user is the owner, enable view reactions
            Button viewReactionsBtn = deedGO.transform.Find("ViewReactionsButton")?.GetComponent<Button>();
            if (viewReactionsBtn != null)
            {
                viewReactionsBtn.gameObject.SetActive(true);
                viewReactionsBtn.onClick.AddListener(() => ShowReactionsPopup(userReactions));
            }
        }
    }

    private void ShowReactionsPopup(Dictionary<string, object> userReactions)
    {
        Debug.Log("🟢 ShowReactionsPopup called.");

        GameObject popup = Instantiate(reactionsPopupPrefab, popupParent);
        Debug.Log("🟢 Instantiated popup prefab.");

        Transform contentParent = popup.transform.Find("TaskScrollView/Viewport/ContentParent");
        if (contentParent == null)
        {
            Debug.LogError("❌ ContentParent not found in popup prefab.");
            return;
        }
        Debug.Log("✅ Found ContentParent.");

        // Clear old children
        foreach (Transform child in contentParent)
        {
            Debug.Log($"🗑️ Destroying old child: {child.name}");
            Destroy(child.gameObject);
        }

        foreach (var kvp in userReactions)
        {
            string userId = kvp.Key;
            string reaction = kvp.Value.ToString();

            Debug.Log($"🔍 Fetching username for userId: {userId} with reaction: {reaction}");

            db.Collection("userInfo").Document(userId).GetSnapshotAsync().ContinueWithOnMainThread(task =>
            {
                string username = userId;

                if (!task.IsCompleted)
                {
                    Debug.LogWarning($"⚠️ Task for userId {userId} not completed.");
                    return;
                }

                if (task.Result.Exists)
                {
                    if (task.Result.ContainsField("Username"))
                    {
                        username = task.Result.GetValue<string>("Username");
                        Debug.Log($"✅ Got username for {userId}: {username}");
                    }
                    else
                    {
                        Debug.LogWarning($"⚠️ Username field missing for userId: {userId}");
                    }
                }
                else
                {
                    Debug.LogWarning($"⚠️ No user document found for {userId}");
                }

                GameObject item = Instantiate(reactionItemPrefab, contentParent);
                Debug.Log($"🧩 Instantiated reactionItemPrefab for {username}: {reaction}");

                TMP_Text txt = item.transform.Find("ContentText")?.GetComponent<TMP_Text>();
                RawImage profileImg = item.transform.Find("ProfileImage")?.GetComponent<RawImage>();

                if (txt != null)
                {
                    txt.text = $"{username}: {reaction}";
                    Debug.Log($"✍️ Set reaction text: {txt.text}");
                }
                else
                {
                    Debug.LogError("❌ TMP_Text 'ContentText' not found in reactionItemPrefab.");
                }

                if (profileImg != null)
                {
                    if (task.Result.ContainsField("profilePicUrl"))
                    {
                        string profileUrl = task.Result.GetValue<string>("profilePicUrl");
                        Debug.Log($"🖼️ Loading profile image for {username} from {profileUrl}");
                        StartCoroutine(LoadImage(profileUrl, profileImg));
                    }
                    else
                    {
                        Debug.LogWarning($"⚠️ profilePicUrl missing for {username}");
                        profileImg.gameObject.SetActive(false); // optional fallback
                    }
                }
                else
                {
                    Debug.LogError("❌ RawImage 'ProfileImage' not found in reactionItemPrefab.");
                }
            });
        }

        Button closeBtn = popup.transform.Find("CloseButton")?.GetComponent<Button>();
        if (closeBtn != null)
        {
            closeBtn.onClick.AddListener(() =>
            {
                Debug.Log("❎ Close button clicked. Destroying popup and hiding screen.");
                Destroy(popup);
            });
        }
        else
        {
            Debug.LogError("❌ CloseButton not found inside popup prefab.");
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

                if (prevReaction == reactionType)
                {
                    updates[$"reactions.{prevReaction}"] = FieldValue.Increment(-1);
                    updates[$"userReactions.{userId}"] = FieldValue.Delete;
                }
                else
                {
                    if (!string.IsNullOrEmpty(prevReaction))
                        updates[$"reactions.{prevReaction}"] = FieldValue.Increment(-1);

                    updates[$"reactions.{reactionType}"] = FieldValue.Increment(1);
                    updates[$"userReactions.{userId}"] = reactionType;
                }

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
