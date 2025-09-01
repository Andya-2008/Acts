using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using Firebase.Storage;
using UnityEngine.Networking;

public class TaskListUI : MonoBehaviour
{
    public GameObject taskItemPrefab;
    public Transform taskContainer;
    public TMP_Dropdown taskTypeDropdown;
    public ScrollRect scrollRect;
    public float pullThreshold = 100f;

    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private FirebaseStorage storage;
    private HashSet<string> uploadedTaskIds = new HashSet<string>();
    private bool isPulling = false;
    private float pullStartY = 0f;

    private string currentTaskType = "dailyTask";
    private string currentDocName = "today";

    public TMP_Dropdown completionFilterDropdown;
    private enum CompletionFilter { All, Incomplete, Complete }
    private CompletionFilter currentFilter = CompletionFilter.All;

    public GameObject taskDetailPopupPrefab;
    public Transform popupParent;
    public GameObject customTaskPopupPrefab;

    // ---------------- helpers ----------------
    static void EnableOnly(Transform parent, string childToEnable)
    {
        if (parent == null) return;
        foreach (Transform t in parent) t.gameObject.SetActive(false);
        if (string.IsNullOrEmpty(childToEnable)) return;
        var child = parent.Find(childToEnable);
        if (child != null) child.gameObject.SetActive(true);
    }

    static int ParseToInt(object v)
    {
        if (v == null) return 0;
        if (v is int i) return i;
        if (v is long l) return (int)l;
        if (v is double d) return (int)d;
        int.TryParse(v.ToString(), out var x);
        return x;
    }

    static string PrettyLen(string len)
    {
        if (string.IsNullOrEmpty(len)) return "";
        len = len.ToLowerInvariant();
        if (len == "daily") return "Daily";
        if (len == "weekly") return "Weekly";
        if (len == "monthly") return "Monthly";
        return char.ToUpper(len[0]) + len.Substring(1);
    }

    static string DifficultyName(int d)
        => d == 1 ? "Easy"
         : d == 2 ? "Medium"
         : d == 3 ? "Hard"
         : d == 4 ? "AHHHHH"
         : "?";

    void Start()
    {
        completionFilterDropdown.onValueChanged.AddListener(OnCompletionFilterChanged);

        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;

        taskTypeDropdown.onValueChanged.AddListener(OnTaskTypeChanged);
        LoadTasks();
    }

    void OnCompletionFilterChanged(int index)
    {
        currentFilter = (CompletionFilter)index;
        LoadTasks();
    }

    public void OnTaskTypeChanged(int index)
    {
        switch (index)
        {
            case 0: currentTaskType = "dailyTask"; currentDocName = "today"; break;
            case 1: currentTaskType = "weeklyTask"; currentDocName = "thisWeek"; break;
            case 2: currentTaskType = "monthlyTask"; currentDocName = "thisMonth"; break;
            case 3: currentTaskType = "all"; break;
        }
        LoadTasks();
    }

    private void Update()
    {
        if (scrollRect == null || scrollRect.verticalNormalizedPosition < 0.98f) return;

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_WEBGL
        if (Input.GetMouseButtonDown(0))
        {
            isPulling = true;
            pullStartY = Input.mousePosition.y;
        }
        else if (Input.GetMouseButtonUp(0) && isPulling)
        {
            float pullDelta = Input.mousePosition.y - pullStartY;
            if (pullDelta < -pullThreshold) LoadTasks();
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
                if (pullDelta > pullThreshold) LoadTasks();
                isPulling = false;
            }
        }
#endif
    }

    public async void LoadTasks()
    {
        uploadedTaskIds.Clear();
        foreach (Transform child in taskContainer)
            Destroy(child.gameObject);

        string userId = auth.CurrentUser.UserId;

        if (currentTaskType == "all")
        {
            await LoadTasksFromDoc(userId, "dailyTask", "today");
            await LoadTasksFromDoc(userId, "weeklyTask", "thisWeek");
            await LoadTasksFromDoc(userId, "monthlyTask", "thisMonth");
        }
        else
        {
            await LoadTasksFromDoc(userId, currentTaskType, currentDocName);
        }
    }

    private async System.Threading.Tasks.Task LoadTasksFromDoc(string userId, string taskType, string docName)
    {
        var docRef = db.Collection("userInfo").Document(userId).Collection(taskType).Document(docName);
        var docSnap = await docRef.GetSnapshotAsync();
        if (!docSnap.Exists || !docSnap.ContainsField("tasks")) return;

        var tasks = docSnap.GetValue<List<object>>("tasks");

        foreach (var raw in tasks)
        {
            var data = raw as Dictionary<string, object>;
            if (data == null) continue;

            string taskId = data["taskId"].ToString();
            string text = data.ContainsKey("textShort") ? data["textShort"].ToString() : "";
            bool completed = data.ContainsKey("completed") && (bool)data["completed"];

            // Completion filter (if you use it)
            if (currentFilter == CompletionFilter.Complete && !completed) continue;
            if (currentFilter == CompletionFilter.Incomplete && completed) continue;

            // Build card
            GameObject taskGO = Instantiate(taskItemPrefab, taskContainer);
            taskGO.transform.Find("TaskText")?.GetComponent<TMP_Text>()?.SetText(text);

            // ---------------- INCOMPLETE GROUP (chips) ----------------
            // Length chip
            string len = data.ContainsKey("length") ? (data["length"]?.ToString() ?? "") : "";
            if (string.IsNullOrEmpty(len))
            {
                len = taskType == "dailyTask" ? "daily" :
                      taskType == "weeklyTask" ? "weekly" :
                      taskType == "monthlyTask" ? "monthly" : "";
            }
            Transform lengthParent = taskGO.transform.Find("Incomplete/LengthParent");
            string lengthChild =
                len.ToLower() == "daily" ? "Length" :
                len.ToLower() == "weekly" ? "Length (1)" :
                len.ToLower() == "monthly" ? "Length (2)" : null;
            if (!string.IsNullOrEmpty(lengthChild)) EnableOnly(lengthParent, lengthChild);

            // Optional label if you keep one
            var typeText = taskGO.transform.Find("LengthBackground/TaskTypeText")?.GetComponent<TMP_Text>();
            if (typeText != null) typeText.text = PrettyLen(len);

            // Difficulty chip
            int diffInt = data.ContainsKey("difficulty") ? Mathf.Clamp(ParseToInt(data["difficulty"]), 1, 4) : 0;
            Transform diffParent = taskGO.transform.Find("Incomplete/DifficultyParent");
            string[] diffNames = { "Difficulty", "Difficulty (1)", "Difficulty (2)", "Difficulty (3)" };
            if (diffParent != null && diffInt >= 1 && diffInt <= 4)
                EnableOnly(diffParent, diffNames[diffInt - 1]);
            // Optional difficulty text
            var diffText = taskGO.transform.Find("Incomplete/DifficultyText")?.GetComponent<TMP_Text>();
            if (diffText != null) diffText.text = $"Difficulty: {DifficultyName(diffInt)}";

            // Photo recommended (Yes/No)
            bool photoRecommended = false;
            if (data.ContainsKey("picture"))
            {
                var pv = data["picture"];
                if (pv is bool b) photoRecommended = b;
                else photoRecommended = pv.ToString().Trim().ToLowerInvariant().StartsWith("y");
            }
            Transform photoRecParent = taskGO.transform.Find("Incomplete/Photo");
            if (photoRecParent != null)
                EnableOnly(photoRecParent, photoRecommended ? "PhotoRequired" : "PhotoRequired (1)");

            // ---------------- COMPLETE GROUP (photo + deed feed) ----------------
            // Determine if a photo exists for this task
            // ----- Determine if a photo is present for THIS completion -----
            bool hasPhoto = false;
            string photoUrl = "";

            // Only check history if the task is currently completed
            if (completed)
            {
                var historyDoc = await db.Collection("userInfo").Document(userId)
                                         .Collection("taskHistory").Document(taskId)
                                         .GetSnapshotAsync();

                if (historyDoc.Exists && historyDoc.ContainsField("photoUrl"))
                {
                    photoUrl = historyDoc.GetValue<string>("photoUrl") ?? "";
                    hasPhoto = !string.IsNullOrEmpty(photoUrl);
                }
            }

            // ----- COMPLETE group: photo state + photo button -----
            Transform completePhoto = taskGO.transform.Find("Complete/Photo");
            if (completePhoto != null)
            {
                // Explicitly hide both first
                var uploadedGO = completePhoto.Find("PhotoUploaded")?.gameObject;
                var notUploadedGO = completePhoto.Find("PhotoNotUploaded")?.gameObject;

                if (uploadedGO != null) uploadedGO.SetActive(false);
                if (notUploadedGO != null) notUploadedGO.SetActive(false);

                // Show exactly one if the task is completed
                if (completed)
                {
                    if (uploadedGO != null) uploadedGO.SetActive(hasPhoto);
                    if (notUploadedGO != null) notUploadedGO.SetActive(!hasPhoto);
                }

                // Keep the PhotoButton visible; interactable only when completed
                var photoBtn = completePhoto.Find("PhotoButton")?.GetComponent<UnityEngine.UI.Button>();
                if (photoBtn != null)
                {
                    photoBtn.gameObject.SetActive(true);
                    photoBtn.onClick.RemoveAllListeners();
                    photoBtn.interactable = completed;
                    if (completed) photoBtn.onClick.AddListener(() => PickAndUploadTaskPhoto(taskId));
                }
            }

            // UploadButton (Deed Feed) – enabled only if completed, has photo, and not uploaded yet
            var deedBtn = taskGO.transform.Find("UploadButton")?.GetComponent<Button>();
            if (deedBtn != null)
            {
                deedBtn.onClick.RemoveAllListeners();
                bool canUpload = completed && hasPhoto && !uploadedTaskIds.Contains(taskId);
                deedBtn.interactable = canUpload;
                if (canUpload)
                {
                    deedBtn.onClick.AddListener(() =>
                    {
                        if (!uploadedTaskIds.Contains(taskId))
                        {
                            uploadedTaskIds.Add(taskId);
                            StartCoroutine(UploadToDeedFeed(taskId, text));
                        }
                    });
                }
            }

            // ---------------- Toggle button + parents flip ----------------
            var toggleBtn = taskGO.transform.Find("ToggleButton")?.GetComponent<Button>();
            if (toggleBtn != null)
            {
                toggleBtn.onClick.RemoveAllListeners();
                toggleBtn.onClick.AddListener(() =>
                    ToggleTaskCompletion(taskType, docName, taskId, taskGO));
            }

            // Initial parent visibility + toggle label
            Transform incompleteParent = taskGO.transform.Find("Incomplete");
            Transform completeParent = taskGO.transform.Find("Complete");
            if (incompleteParent != null) incompleteParent.gameObject.SetActive(!completed);
            if (completeParent != null) completeParent.gameObject.SetActive(completed);

            var toggleText = taskGO.transform.Find("ToggleButton/ToggleButtonText")?.GetComponent<TMP_Text>();
            if (toggleText != null) toggleText.text = completed ? "Complete" : "Incomplete";

            // Tap background to open details (optional; keep if you have the popup)
            Transform bg = taskGO.transform.Find("Background");
            if (bg != null)
            {
                var bgButton = bg.GetComponent<Button>() ?? bg.gameObject.AddComponent<Button>();
                bgButton.onClick.RemoveAllListeners();
                bgButton.onClick.AddListener(() => ShowTaskDetailPopup(data));
            }
        }
    }

    // INCOMPLETE parent: length/difficulty/photo-recommended images
    private void SetupIncompleteGroup(Transform card, Dictionary<string, object> data, string sourceTaskType)
    {
        // Length chip
        string len = data.ContainsKey("length") ? data["length"].ToString() : "";
        if (string.IsNullOrEmpty(len))
        {
            len = sourceTaskType == "dailyTask" ? "daily" :
                  sourceTaskType == "weeklyTask" ? "weekly" :
                  sourceTaskType == "monthlyTask" ? "monthly" : "";
        }

        Transform lengthParent = card.Find("Incomplete/LengthParent");
        string lengthChild =
            len.ToLower() == "daily" ? "Length" :
            len.ToLower() == "weekly" ? "Length (1)" :
            len.ToLower() == "monthly" ? "Length (2)" : null;
        if (!string.IsNullOrEmpty(lengthChild))
            EnableOnly(lengthParent, lengthChild);

        // Optional label if you kept it
        var typeText = card.Find("LengthBackground/TaskTypeText")?.GetComponent<TMP_Text>();
        if (typeText != null) typeText.text = PrettyLen(len);

        // Difficulty chip
        int diffInt = data.ContainsKey("difficulty") ? Mathf.Clamp(ParseToInt(data["difficulty"]), 1, 4) : 0;
        Transform diffParent = card.Find("Incomplete/DifficultyParent");
        string[] diffNames = { "Difficulty", "Difficulty (1)", "Difficulty (2)", "Difficulty (3)" };
        if (diffParent != null && diffInt >= 1 && diffInt <= 4)
            EnableOnly(diffParent, diffNames[diffInt - 1]);

        // Optional difficulty label
        var diffText = card.Find("Incomplete/DifficultyText")?.GetComponent<TMP_Text>();
        if (diffText != null) diffText.text = $"Difficulty: {DifficultyName(diffInt)}";

        // Photo recommended image (Yes/No)
        bool photoRecommended = false;
        if (data.ContainsKey("picture"))
        {
            var pv = data["picture"];
            if (pv is bool b) photoRecommended = b;
            else photoRecommended = pv.ToString().Trim().ToLowerInvariant().StartsWith("y");
        }
        Transform photoParent = card.Find("Incomplete/Photo");
        if (photoParent != null)
            EnableOnly(photoParent, photoRecommended ? "PhotoRequired" : "PhotoRequired (1)");
    }

    // COMPLETE parent: photo status and deed feed availability.
    // COMPLETE parent: photo state + button + deed-feed enablement
    private IEnumerator SetupCompleteGroup(Transform card, string taskId, string prompt, bool completedNow)
    {
        string userId = auth.CurrentUser.UserId;

        // Consider a photo "present" only for THIS completion: read from taskHistory.photoUrl
        bool hasPhoto = false;
        string photoUrl = "";

        if (completedNow)
        {
            var historyDocTask = db.Collection("userInfo").Document(userId)
                                   .Collection("taskHistory").Document(taskId).GetSnapshotAsync();
            yield return new WaitUntil(() => historyDocTask.IsCompleted);

            var historyDoc = historyDocTask.Result;
            if (historyDoc.Exists && historyDoc.ContainsField("photoUrl"))
            {
                photoUrl = historyDoc.GetValue<string>("photoUrl") ?? "";
                hasPhoto = !string.IsNullOrEmpty(photoUrl);
            }
        }

        // ---- Flip ONLY the two state icons; never hide the PhotoButton ----
        Transform completePhoto = card.Find("Complete/Photo");
        if (completePhoto != null)
        {
            var uploadedGO = completePhoto.Find("PhotoUploaded")?.gameObject;
            var notUploadedGO = completePhoto.Find("PhotoNotUploaded")?.gameObject;

            // Hide both first to avoid double-visible glitch
            if (uploadedGO != null) uploadedGO.SetActive(false);
            if (notUploadedGO != null) notUploadedGO.SetActive(false);

            // Show exactly one when completed
            if (completedNow)
            {
                if (uploadedGO != null) uploadedGO.SetActive(hasPhoto);
                if (notUploadedGO != null) notUploadedGO.SetActive(!hasPhoto);
            }

            // Keep the PhotoButton visible; only interactable when completed
            var photoBtn = completePhoto.Find("PhotoButton")?.GetComponent<UnityEngine.UI.Button>();
            if (photoBtn != null)
            {
                photoBtn.gameObject.SetActive(true);
                photoBtn.onClick.RemoveAllListeners();
                photoBtn.interactable = completedNow;
                if (completedNow) photoBtn.onClick.AddListener(() => PickAndUploadTaskPhoto(taskId));
            }
        }

        // ---- Deed Feed upload button ----
        var deedBtn = card.Find("UploadButton")?.GetComponent<UnityEngine.UI.Button>();
        if (deedBtn != null)
        {
            deedBtn.onClick.RemoveAllListeners();
            bool canUpload = completedNow && hasPhoto && !uploadedTaskIds.Contains(taskId);
            deedBtn.interactable = canUpload;
            if (canUpload)
            {
                deedBtn.onClick.AddListener(() =>
                {
                    if (!uploadedTaskIds.Contains(taskId))
                    {
                        uploadedTaskIds.Add(taskId);
                        StartCoroutine(UploadToDeedFeed(taskId, prompt));
                    }
                });
            }
        }

        yield break;
    }

    // Shows one of the two groups + updates ToggleButton text
    private void RenderCompletionState(Transform card, bool completed)
    {
        var incomplete = card.Find("Incomplete");
        var complete = card.Find("Complete");

        if (incomplete != null) incomplete.gameObject.SetActive(!completed);
        if (complete != null) complete.gameObject.SetActive(completed);

        var btnText = card.Find("ToggleButton/ToggleButtonText")?.GetComponent<TMP_Text>();
        if (btnText != null) btnText.text = completed ? "Complete" : "Incomplete";
    }

    // Persist + immediate UI flip
    public async void ToggleTaskCompletion(string taskType, string docName, string taskId, GameObject taskGO)
    {
        string userId = auth.CurrentUser.UserId;
        var docRef = db.Collection("userInfo").Document(userId).Collection(taskType).Document(docName);
        var docSnap = await docRef.GetSnapshotAsync();

        if (!docSnap.Exists || !docSnap.ContainsField("tasks")) return;

        var rawTasks = docSnap.GetValue<List<object>>("tasks");
        List<Dictionary<string, object>> updatedTasks = new List<Dictionary<string, object>>();
        bool newCompletedState = false;

        foreach (var raw in rawTasks)
        {
            var task = raw as Dictionary<string, object>;
            if (task["taskId"].ToString() == taskId)
            {
                bool completed = (bool)task["completed"];
                newCompletedState = !completed;
                task["completed"] = newCompletedState;

                var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory").Document(taskId);

                if (!completed)
                {
                    await historyRef.SetAsync(new Dictionary<string, object> {
                    { "completedAt", Timestamp.GetCurrentTimestamp() },
                    { "textShort", task["textShort"] },
                    { "difficulty", task.ContainsKey("difficulty") ? task["difficulty"] : "?" },
                    { "photoUrl", "" }
                });
                }
                else
                {
                    await historyRef.DeleteAsync();
                }
            }
            updatedTasks.Add(task);
        }

        await docRef.UpdateAsync(new Dictionary<string, object> { { "tasks", updatedTasks } });

        // 🔄 Toggle UI parents
        Transform incompleteParent = taskGO.transform.Find("Incomplete");
        Transform completeParent = taskGO.transform.Find("Complete");
        if (incompleteParent != null && completeParent != null)
        {
            incompleteParent.gameObject.SetActive(!newCompletedState);
            completeParent.gameObject.SetActive(newCompletedState);
        }
    }

    // ---------- existing photo upload / feed code (unchanged except for reuse) ----------
    public void PickAndUploadTaskPhoto(string taskId)
    {
        NativeGallery.GetImageFromGallery(path =>
        {
            if (path != null)
            {
                Texture2D texture = NativeGallery.LoadImageAtPath(path, 1024, false);
                if (texture != null) StartCoroutine(UploadTaskPhoto(taskId, texture));
            }
        }, "Select a photo for your task", "image/*");
    }

    private IEnumerator UploadTaskPhoto(string taskId, Texture2D texture)
    {
        string userId = auth.CurrentUser.UserId;
        string storagePath = $"task_photos/{userId}/{taskId}.png";
        StorageReference storageRef = storage.GetReference(storagePath);

        byte[] pngData = texture.EncodeToPNG();
        var uploadTask = storageRef.PutBytesAsync(pngData);
        yield return new WaitUntil(() => uploadTask.IsCompleted);

        if (uploadTask.IsFaulted || uploadTask.IsCanceled) yield break;

        var getUrlTask = storageRef.GetDownloadUrlAsync();
        yield return new WaitUntil(() => getUrlTask.IsCompleted);
        if (getUrlTask.IsFaulted || getUrlTask.IsCanceled) yield break;

        string downloadUrl = getUrlTask.Result.ToString();

        var saveTask = db.Collection("userInfo").Document(auth.CurrentUser.UserId)
            .Collection("taskPhotos").Document(taskId)
            .SetAsync(new Dictionary<string, object> {
                { "url", downloadUrl },
                { "uploadedAt", Timestamp.GetCurrentTimestamp() }
            });
        yield return new WaitUntil(() => saveTask.IsCompleted);

        var historyRef = db.Collection("userInfo").Document(auth.CurrentUser.UserId).Collection("taskHistory").Document(taskId);
        var saveHistoryUrlTask = historyRef.UpdateAsync(new Dictionary<string, object> { { "photoUrl", downloadUrl } });
        yield return new WaitUntil(() => saveHistoryUrlTask.IsCompleted);

        // Find the card in the list and refresh just its "Complete" group UI
        foreach (Transform card in taskContainer)
        {
            var textCmp = card.Find("TaskText")?.GetComponent<TMP_Text>();
            if (textCmp == null) continue;
            // best-effort: refresh all cards; it’s cheap
            string prompt = textCmp.text;
            StartCoroutine(SetupCompleteGroup(card, taskId, prompt, card.Find("Complete")?.gameObject.activeSelf ?? false));
        }
    }

    private async void LoadTaskPhotoIfExists(string taskId, RawImage image)
    {
        if (image == null) return;
        string userId = auth.CurrentUser.UserId;
        var photoDoc = await db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();

        if (photoDoc.Exists && photoDoc.ContainsField("url"))
        {
            string url = photoDoc.GetValue<string>("url");
            UnityWebRequest req = UnityWebRequestTexture.GetTexture(url);
            await req.SendWebRequest();
            if (req.result == UnityWebRequest.Result.Success)
            {
                image.texture = ((DownloadHandlerTexture)req.downloadHandler).texture;
                image.gameObject.SetActive(true);
            }
            else image.gameObject.SetActive(false);
        }
        else image.gameObject.SetActive(false);
    }

    private IEnumerator UploadToDeedFeed(string taskId, string prompt)
    {
        string userId = auth.CurrentUser.UserId;

        var photoDocTask = db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();
        yield return new WaitUntil(() => photoDocTask.IsCompleted);

        var photoDoc = photoDocTask.Result;
        if (!photoDoc.Exists || !photoDoc.ContainsField("url")) yield break;

        string photoUrl = photoDoc.GetValue<string>("url");

        var userDocTask = db.Collection("userInfo").Document(userId).GetSnapshotAsync();
        yield return new WaitUntil(() => userDocTask.IsCompleted);

        var userDoc = userDocTask.Result;
        string username = userDoc.ContainsField("Username") ? userDoc.GetValue<string>("Username") : "Unknown";
        string profilePicUrl = userDoc.ContainsField("profilePicUrl") ? userDoc.GetValue<string>("profilePicUrl") : "";
        List<string> traits = userDoc.ContainsField("Traits") ? new List<string>(userDoc.GetValue<List<string>>("Traits")) : new List<string>();

        var deedData = new Dictionary<string, object>
        {
            { "userId", userId },
            { "username", username },
            { "profilePicUrl", profilePicUrl },
            { "prompt", prompt },
            { "photoUrl", photoUrl },
            { "timestamp", Timestamp.GetCurrentTimestamp() },
            { "traits", traits },
            { "reactions", new Dictionary<string, object> {
                { "like", 0 }, { "heart", 0 }, { "hug", 0 }, { "wow", 0 }
            }}
        };

        var deedUploadTask = db.Collection("deeds").AddAsync(deedData);
        yield return new WaitUntil(() => deedUploadTask.IsCompleted);
    }

    // -------- popup + misc (unchanged) ----------
    private void ShowTaskDetailPopup(Dictionary<string, object> data)
    {
        GameObject popup = Instantiate(taskDetailPopupPrefab, popupParent);
        popup.SetActive(true);

        string textShort = data.ContainsKey("textShort") ? data["textShort"].ToString() : "";
        string textLong = data.ContainsKey("text") ? data["text"].ToString() : "";
        string category = data.ContainsKey("category") ? data["category"].ToString() : "";
        string length = data.ContainsKey("length") ? data["length"].ToString() : "";
        int difficulty = data.ContainsKey("difficulty") ? Mathf.Clamp(ParseToInt(data["difficulty"]), 1, 4) : 0;
        string minAgeStr = data.ContainsKey("minAge") ? data["minAge"].ToString() : "";
        string maxAgeStr = data.ContainsKey("maxAge") ? data["maxAge"].ToString() : "";
        bool picture = data.ContainsKey("picture") && (data["picture"] is bool pb ? pb : data["picture"].ToString().Trim().ToLower().StartsWith("y"));

        List<object> rawTraits = data.ContainsKey("traits") ? (List<object>)data["traits"] : new List<object>();
        List<object> rawMaterials = data.ContainsKey("materials") ? (List<object>)data["materials"] : new List<object>();

        List<string> traits = rawTraits.ConvertAll(t => t.ToString());
        List<string> materials = rawMaterials.ConvertAll(m => m.ToString());

        popup.transform.Find("HeaderBackground/HeaderText")?.GetComponent<TMP_Text>()?.SetText(textShort);
        popup.transform.Find("DescriptionText")?.GetComponent<TMP_Text>()?.SetText(textLong);
        popup.transform.Find("CategoryText")?.GetComponent<TMP_Text>()?.SetText($"Category: {ToTitleCase(category)}");
        popup.transform.Find("DifficultyText")?.GetComponent<TMP_Text>()?.SetText($"Difficulty: {DifficultyName(difficulty)}");

        string ageDisplay;
        if (int.TryParse(minAgeStr, out int min) && int.TryParse(maxAgeStr, out int max))
            ageDisplay = (max > 90) ? $"{min}+" : $"{min}–{max}";
        else ageDisplay = $"{minAgeStr}–{maxAgeStr}";
        popup.transform.Find("AgeText")?.GetComponent<TMP_Text>()?.SetText($"Target Age Range: {ageDisplay}");

        popup.transform.Find("TraitsText")?.GetComponent<TMP_Text>()?.SetText($"Traits: {CapitalizeList(traits)}");
        popup.transform.Find("MaterialsText")?.GetComponent<TMP_Text>()?.SetText($"Materials: {CapitalizeList(materials)}");
        popup.transform.Find("PictureText")?.GetComponent<TMP_Text>()?.SetText($"Photo Recommended: {(picture ? "Yes" : "No")}");
        popup.transform.Find("LengthText")?.GetComponent<TMP_Text>()?.SetText($"Type: {PrettyLen(length)}");

        var closeBtn = popup.transform.Find("CloseButton")?.GetComponent<Button>();
        if (closeBtn != null) closeBtn.onClick.AddListener(() => Destroy(popup));
    }

    public void OpenCustomTaskPopup()
    {
        GameObject popup = Instantiate(customTaskPopupPrefab, popupParent);
        popup.SetActive(true);

        TMP_InputField shortText = popup.transform.Find("HeaderBackground/ShortTextInput")?.GetComponent<TMP_InputField>();
        TMP_InputField longText = popup.transform.Find("LongTextInput")?.GetComponent<TMP_InputField>();
        TMP_Dropdown difficultyDropdown = popup.transform.Find("DifficultyDropdown")?.GetComponent<TMP_Dropdown>();
        TMP_Dropdown categoryDropdown = popup.transform.Find("CategoryDropdown")?.GetComponent<TMP_Dropdown>();
        RawImage preview = popup.transform.Find("PhotoPreview")?.GetComponent<RawImage>();
        Toggle deedFeedToggle = popup.transform.Find("DeedFeedToggle")?.GetComponent<Toggle>();

        string imagePath = null;

        Button uploadBtn = popup.transform.Find("Complete/UploadButton")?.GetComponent<Button>();
        if (uploadBtn != null)
        {
            uploadBtn.onClick.AddListener(() =>
            {
                NativeGallery.GetImageFromGallery(path =>
                {
                    if (path != null)
                    {
                        imagePath = path;
                        Texture2D tex = NativeGallery.LoadImageAtPath(path, 1024);
                        if (preview != null) preview.texture = tex;
                    }
                }, "Pick a photo", "image/*");
            });
        }

        Button submitBtn = popup.transform.Find("SubmitButton")?.GetComponent<Button>();
        if (submitBtn != null)
        {
            submitBtn.onClick.AddListener(() =>
                StartCoroutine(SubmitCustomTask(
                    shortText.text,
                    longText.text,
                    categoryDropdown.options[categoryDropdown.value].text,
                    difficultyDropdown.options[difficultyDropdown.value].text,
                    imagePath,
                    deedFeedToggle.isOn,
                    popup)));
        }

        popup.transform.Find("CloseButton")?.GetComponent<Button>()?.onClick.AddListener(() => Destroy(popup));
    }

    private IEnumerator SubmitCustomTask(string shortText, string longText, string category, string difficulty, string imagePath, bool postToDeedFeed, GameObject popup)
    {
        string userId = auth.CurrentUser.UserId;
        string taskId = Guid.NewGuid().ToString();
        string photoUrl = "";

        if (!string.IsNullOrWhiteSpace(imagePath))
        {
            Texture2D texture = NativeGallery.LoadImageAtPath(imagePath, 1024, false);
            if (texture == null) yield break;

            byte[] data = texture.EncodeToPNG();
            var storageRef = storage.GetReference($"task_photos/{userId}/{taskId}.png");
            var uploadTask = storageRef.PutBytesAsync(data);
            yield return new WaitUntil(() => uploadTask.IsCompleted);

            var urlTask = storageRef.GetDownloadUrlAsync();
            yield return new WaitUntil(() => urlTask.IsCompleted);
            if (urlTask.Exception != null) yield break;

            photoUrl = urlTask.Result.ToString();
        }

        var taskData = new Dictionary<string, object>
        {
            { "textShort", shortText },
            { "text", longText },
            { "category", category },
            { "difficulty", difficulty },
            { "photoUrl", photoUrl },
            { "completedAt", Timestamp.GetCurrentTimestamp() }
        };

        var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory").Document(taskId);
        var photoRef = db.Collection("userInfo").Document(userId).Collection("taskPhotos").Document(taskId);

        var setTask = historyRef.SetAsync(taskData);
        yield return new WaitUntil(() => setTask.IsCompleted);

        if (!string.IsNullOrEmpty(photoUrl))
        {
            var photoTask = photoRef.SetAsync(new Dictionary<string, object> {
                { "url", photoUrl }, { "uploadedAt", Timestamp.GetCurrentTimestamp() }
            });
            yield return new WaitUntil(() => photoTask.IsCompleted);
        }

        if (postToDeedFeed)
        {
            var userDocTask = db.Collection("userInfo").Document(userId).GetSnapshotAsync();
            yield return new WaitUntil(() => userDocTask.IsCompleted);

            DocumentSnapshot userDoc = userDocTask.Result;
            string username = userDoc.Exists && userDoc.ContainsField("Username") ? userDoc.GetValue<string>("Username") : "Anonymous";
            string profilePicUrl = userDoc.Exists && userDoc.ContainsField("profilePicUrl") ? userDoc.GetValue<string>("profilePicUrl") : "";
            List<string> traits = userDoc.Exists && userDoc.ContainsField("Traits") ? new List<string>(userDoc.GetValue<List<string>>("Traits")) : new List<string>();

            var deedData = new Dictionary<string, object>
            {
                { "userId", userId },
                { "username", username },
                { "profilePicUrl", profilePicUrl },
                { "prompt", shortText },
                { "photoUrl", photoUrl },
                { "timestamp", Timestamp.GetCurrentTimestamp() },
                { "traits", traits },
                { "reactions", new Dictionary<string, object> { { "like", 0 }, { "heart", 0 }, { "hug", 0 }, { "wow", 0 } } }
            };

            var deedUploadTask = db.Collection("deeds").AddAsync(deedData);
            yield return new WaitUntil(() => deedUploadTask.IsCompleted);
        }

        Destroy(popup);
        LoadTasks();
    }

    string ToTitleCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return "";
        var words = input.Split(' ');
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
                words[i] = char.ToUpper(words[i][0]) + words[i].Substring(1);
        }
        return string.Join(" ", words);
    }

    string CapitalizeList(List<string> items)
    {
        return string.Join(", ", items.ConvertAll(item =>
            string.IsNullOrWhiteSpace(item) ? "" :
            char.ToUpper(item[0]) + item.Substring(1).ToLower()));
    }
}
