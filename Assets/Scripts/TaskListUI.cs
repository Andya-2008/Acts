using System;
using System.Collections;
using System.Collections.Generic;
using System.Threading.Tasks;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using Firebase.Storage;

public class TaskListUI : MonoBehaviour
{
    [Header("List & Prefabs")]
    [SerializeField] private GameObject taskItemPrefab;
    [SerializeField] private Transform taskContainer;

    [Header("Filters & Controls")]
    [SerializeField] private TMP_Dropdown taskTypeDropdown;          // 0=daily,1=weekly,2=monthly,3=all
    [SerializeField] private TMP_Dropdown completionFilterDropdown;  // 0=All,1=Incomplete,2=Complete
    [SerializeField] private ScrollRect scrollRect;
    [SerializeField] private float pullThreshold = 100f;

    [Header("Popups")]
    [SerializeField] private GameObject taskDetailPopupPrefab;
    [SerializeField] private Transform popupParent;
    [SerializeField] private GameObject customTaskPopupPrefab;

    // Firebase
    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private FirebaseStorage storage;

    // State
    private string currentTaskType = "dailyTask"; // "dailyTask" | "weeklyTask" | "monthlyTask" | "all"
    private string currentDocName = "today";      // "today" | "thisWeek" | "thisMonth"
    private enum CompletionFilter { All, Incomplete, Complete }
    private CompletionFilter currentFilter = CompletionFilter.All;

    private bool isPulling = false;
    private float pullStartY = 0f;

    // Session guard to avoid double-uploads
    private readonly HashSet<string> uploadedTaskIds = new HashSet<string>();
    // Track card views by taskId for quick refresh
    private readonly Dictionary<string, TaskCardView> cardByTaskId = new Dictionary<string, TaskCardView>();

    // ----------------- Unity lifecycle -----------------
    private void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;

        if (taskTypeDropdown) taskTypeDropdown.onValueChanged.AddListener(OnTaskTypeChanged);
        if (completionFilterDropdown) completionFilterDropdown.onValueChanged.AddListener(OnCompletionFilterChanged);

        LoadTasks();
    }

    private void Update()
    {
        if (scrollRect == null) return;

#if UNITY_EDITOR || UNITY_STANDALONE || UNITY_WEBGL
        if (scrollRect.verticalNormalizedPosition > 0.98f)
        {
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
        }
#elif UNITY_IOS || UNITY_ANDROID
        if (scrollRect.verticalNormalizedPosition < 0.02f)
        {
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
        }
#endif
    }

    // ----------------- Dropdown handlers -----------------
    private void OnTaskTypeChanged(int index)
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

    private void OnCompletionFilterChanged(int index)
    {
        currentFilter = (CompletionFilter)index;
        LoadTasks();
    }

    // ----------------- Load & render -----------------
    public async void LoadTasks()
    {
        uploadedTaskIds.Clear();
        cardByTaskId.Clear();

        foreach (Transform child in taskContainer)
            Destroy(child.gameObject);

        if (auth?.CurrentUser == null)
        {
            Debug.LogWarning("TaskListUI: No current user.");
            return;
        }
        string userId = auth.CurrentUser.UserId;

        try
        {
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
        catch (Exception e)
        {
            Debug.LogError($"TaskListUI.LoadTasks error: {e}");
        }
    }

    private async Task LoadTasksFromDoc(string userId, string taskType, string docName)
    {
        var docRef = db.Collection("userInfo").Document(userId).Collection(taskType).Document(docName);
        var docSnap = await docRef.GetSnapshotAsync();
        if (!docSnap.Exists || !docSnap.ContainsField("tasks")) return;

        var tasks = docSnap.GetValue<List<object>>("tasks");
        if (tasks == null) return;

        foreach (var raw in tasks)
        {
            var data = raw as Dictionary<string, object>;
            if (data == null) continue;

            string taskId = GetString(data, "taskId");
            if (string.IsNullOrEmpty(taskId)) continue;

            string textShort = GetString(data, "textShort");
            bool completed = GetBool(data, "completed");

            // Completion filter
            if (currentFilter == CompletionFilter.Complete && !completed) continue;
            if (currentFilter == CompletionFilter.Incomplete && completed) continue;

            // Instantiate & cache view
            var go = Instantiate(taskItemPrefab, taskContainer);
            var view = go.GetComponent<TaskCardView>();
            if (view == null)
            {
                Debug.LogError("TaskItem prefab is missing TaskCardView.");
                Destroy(go);
                continue;
            }
            cardByTaskId[taskId] = view;

            // ---- Texts
            view.SetTaskText(textShort);

            // ---- Length chip + label
            string len = GetString(data, "length");
            if (string.IsNullOrEmpty(len))
            {
                len = taskType == "dailyTask" ? "daily" :
                      taskType == "weeklyTask" ? "weekly" :
                      taskType == "monthlyTask" ? "monthly" : "";
            }
            string lenLower = len.ToLowerInvariant();
            view.SetLengthChip(lenLower);
            view.SetTypeLabel(PrettyLen(lenLower));

            // ---- Difficulty chip + label
            int diffInt = Mathf.Clamp(ParseToInt(GetObj(data, "difficulty")), 1, 4);
            if (diffInt >= 1 && diffInt <= 4)
            {
                view.SetDifficultyChip(diffInt);
                view.SetDifficultyLabel($"Difficulty: {DifficultyName(diffInt)}");
            }

            // ---- Photo recommended chip
            bool photoRecommended = GetBoolLoose(GetObj(data, "picture"));
            view.SetPhotoRecommended(photoRecommended);

            // ---- Pull completion state from history: hasPhoto + deedUploaded
            bool hasPhoto = false;
            bool deedUploaded = false;

            if (completed)
            {
                var hist = await db.Collection("userInfo").Document(userId)
                                   .Collection("taskHistory").Document(taskId).GetSnapshotAsync();

                if (hist.Exists)
                {
                    if (hist.ContainsField("photoUrl"))
                    {
                        string pu = hist.GetValue<string>("photoUrl") ?? "";
                        hasPhoto = !string.IsNullOrEmpty(pu);
                    }
                    if (hist.ContainsField("deedUploaded"))
                    {
                        deedUploaded = hist.GetValue<bool>("deedUploaded");
                        if (deedUploaded) uploadedTaskIds.Add(taskId); // sync session cache
                    }
                }
            }

            // ---- Completed flip + photo icons
            view.SetCompletedUI(completed);
            view.SetPhotoState(completed, hasPhoto);

            // ---- Deed icons (use persisted flag)
            bool alreadyUploaded = deedUploaded || uploadedTaskIds.Contains(taskId);
            bool canUpload = completed && hasPhoto && !alreadyUploaded;
            view.SetDeedFeedState(completed, hasPhoto, alreadyUploaded, canUpload);

            // ---- Click handlers
            // Toggle completion
            view.OnToggleClicked(() => ToggleTaskCompletion(taskType, docName, taskId));

            // Photo icon click -> pick/upload
            view.OnPhotoIconClicked(() =>
            {
                if (view.IsCompleteVisible())
                    PickAndUploadTaskPhoto(taskId);
            });

            // Deed icon click -> upload to feed (when eligible)
            view.OnDeedIconClicked(() =>
            {
                if (!view.IsCompleteVisible()) return;
                if (uploadedTaskIds.Contains(taskId)) return;

                // Only proceed if Firestore says not uploaded yet
                if (canUpload)
                {
                    uploadedTaskIds.Add(taskId);
                    // Flip deed icons immediately
                    view.SetDeedFeedState(true, hasPhoto: true, uploaded: true, canUpload: false);
                    StartCoroutine(UploadToDeedFeed(taskId, textShort));
                }
            });

            // Background/details
            view.OnBackgroundClicked(() => ShowTaskDetailPopup(data));
        }
    }

    // ----------------- Toggle completion -----------------
    private async void ToggleTaskCompletion(string taskType, string docName, string taskId)
    {
        try
        {
            string userId = auth.CurrentUser.UserId;
            var docRef = db.Collection("userInfo").Document(userId).Collection(taskType).Document(docName);
            var docSnap = await docRef.GetSnapshotAsync();
            if (!docSnap.Exists || !docSnap.ContainsField("tasks")) return;

            var rawTasks = docSnap.GetValue<List<object>>("tasks");
            var updatedTasks = new List<Dictionary<string, object>>();
            bool newCompletedState = false;
            string textShort = "";

            foreach (var raw in rawTasks)
            {
                var task = raw as Dictionary<string, object>;
                if (task == null) continue;

                if (GetString(task, "taskId") == taskId)
                {
                    bool completed = GetBool(task, "completed");
                    newCompletedState = !completed;
                    task["completed"] = newCompletedState;
                    textShort = GetString(task, "textShort");

                    var historyRef = db.Collection("userInfo").Document(userId)
                                       .Collection("taskHistory").Document(taskId);

                    if (!completed)
                    {
                        // Completing now -> create history
                        await historyRef.SetAsync(new Dictionary<string, object> {
                            { "completedAt", Timestamp.GetCurrentTimestamp() },
                            { "textShort", textShort },
                            { "difficulty", task.ContainsKey("difficulty") ? task["difficulty"] : 0 },
                            { "photoUrl", "" },
                            { "deedUploaded", false }
                        }, SetOptions.MergeAll);
                    }
                    else
                    {
                        // Un-completing -> remove history and session flag
                        await historyRef.DeleteAsync();
                        uploadedTaskIds.Remove(taskId);
                    }
                }
                updatedTasks.Add(task);
            }

            await docRef.UpdateAsync(new Dictionary<string, object> { { "tasks", updatedTasks } });

            // Flip UI for that card
            if (cardByTaskId.TryGetValue(taskId, out var view))
            {
                view.SetCompletedUI(newCompletedState);

                bool hasPhoto = false;
                bool deedUploaded = false;

                if (newCompletedState)
                {
                    var hist = await db.Collection("userInfo").Document(userId)
                                       .Collection("taskHistory").Document(taskId).GetSnapshotAsync();
                    if (hist.Exists)
                    {
                        if (hist.ContainsField("photoUrl"))
                            hasPhoto = !string.IsNullOrEmpty(hist.GetValue<string>("photoUrl") ?? "");
                        if (hist.ContainsField("deedUploaded"))
                        {
                            deedUploaded = hist.GetValue<bool>("deedUploaded");
                            if (deedUploaded) uploadedTaskIds.Add(taskId);
                        }
                    }
                }
                else
                {
                    uploadedTaskIds.Remove(taskId);
                }

                view.SetPhotoState(newCompletedState, hasPhoto);

                bool alreadyUploaded = deedUploaded || uploadedTaskIds.Contains(taskId);
                bool canUpload = newCompletedState && hasPhoto && !alreadyUploaded;
                view.SetDeedFeedState(newCompletedState, hasPhoto, alreadyUploaded, canUpload);

                // Rebind deed icon click
                view.OnDeedIconClicked(() =>
                {
                    if (!view.IsCompleteVisible()) return;
                    if (uploadedTaskIds.Contains(taskId)) return;
                    if (canUpload)
                    {
                        uploadedTaskIds.Add(taskId);
                        view.SetDeedFeedState(true, true, true, false);
                        StartCoroutine(UploadToDeedFeed(taskId, textShort));
                    }
                });
            }
        }
        catch (Exception e)
        {
            Debug.LogError($"TaskListUI.ToggleTaskCompletion error: {e}");
        }
    }

    // ----------------- Photo pick & upload -----------------
    public void PickAndUploadTaskPhoto(string taskId)
    {
        NativeGallery.GetImageFromGallery(path =>
        {
            if (path != null)
            {
                Texture2D texture = NativeGallery.LoadImageAtPath(path, 1024, false);
                if (texture != null)
                    StartCoroutine(UploadTaskPhoto(taskId, texture));
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

        if (uploadTask.IsFaulted || uploadTask.IsCanceled)
        {
            Debug.LogError("Photo upload failed.");
            yield break;
        }

        var getUrlTask = storageRef.GetDownloadUrlAsync();
        yield return new WaitUntil(() => getUrlTask.IsCompleted);
        if (getUrlTask.IsFaulted || getUrlTask.IsCanceled)
        {
            Debug.LogError("GetDownloadUrl failed.");
            yield break;
        }

        string downloadUrl = getUrlTask.Result.ToString();

        // Save under userInfo/{uid}/taskPhotos/{taskId}
        var savePhotoDoc = db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId)
            .SetAsync(new Dictionary<string, object> {
                { "url", downloadUrl },
                { "uploadedAt", Timestamp.GetCurrentTimestamp() }
            });
        yield return new WaitUntil(() => savePhotoDoc.IsCompleted);

        // Patch taskHistory.photoUrl (if task is completed)
        var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory").Document(taskId);
        var saveHistoryUrlTask = historyRef.UpdateAsync(new Dictionary<string, object> { { "photoUrl", downloadUrl } });
        yield return new WaitUntil(() => saveHistoryUrlTask.IsCompleted);

        // Refresh that one card (photo + deed icons)
        if (cardByTaskId.TryGetValue(taskId, out var view))
        {
            bool isCompleted = view.IsCompleteVisible();

            view.SetPhotoState(isCompleted, hasPhoto: true);

            bool deedUploaded = false;
            var histTask = db.Collection("userInfo").Document(userId)
                             .Collection("taskHistory").Document(taskId).GetSnapshotAsync();
            yield return new WaitUntil(() => histTask.IsCompleted);
            var histSnap = histTask.Result;
            if (histSnap.Exists && histSnap.ContainsField("deedUploaded"))
                deedUploaded = histSnap.GetValue<bool>("deedUploaded");

            if (deedUploaded) uploadedTaskIds.Add(taskId);

            bool alreadyUploaded = deedUploaded || uploadedTaskIds.Contains(taskId);
            bool canUpload = isCompleted && !alreadyUploaded; // hasPhoto is true
            view.SetDeedFeedState(isCompleted, hasPhoto: true, uploaded: alreadyUploaded, canUpload: canUpload);

            // Bind deed icon click
            view.OnDeedIconClicked(() =>
            {
                if (!view.IsCompleteVisible()) return;
                if (uploadedTaskIds.Contains(taskId)) return;
                if (canUpload)
                {
                    uploadedTaskIds.Add(taskId);
                    view.SetDeedFeedState(true, true, true, false);
                    StartCoroutine(UploadToDeedFeed_WithHistoryPrompt(taskId));
                }
            });
        }
    }

    private IEnumerator UploadToDeedFeed_WithHistoryPrompt(string taskId)
    {
        string userId = auth.CurrentUser.UserId;

        // Get photo URL
        var photoDocTask = db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();
        yield return new WaitUntil(() => photoDocTask.IsCompleted);
        var photoDoc = photoDocTask.Result;
        if (!photoDoc.Exists || !photoDoc.ContainsField("url")) yield break;
        string photoUrl = photoDoc.GetValue<string>("url");

        // Get prompt from history (textShort)
        var histTask = db.Collection("userInfo").Document(userId)
            .Collection("taskHistory").Document(taskId).GetSnapshotAsync();
        yield return new WaitUntil(() => histTask.IsCompleted);
        string prompt = "Completed a task!";
        var hist = histTask.Result;
        if (hist.Exists && hist.ContainsField("textShort"))
            prompt = hist.GetValue<string>("textShort");

        yield return UploadToDeedFeed(taskId, prompt, photoUrl);
    }

    // ----------------- Deed feed upload (persists deedUploaded) -----------------
    private IEnumerator UploadToDeedFeed(string taskId, string prompt)
    {
        string userId = auth.CurrentUser.UserId;

        var photoDocTask = db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();
        yield return new WaitUntil(() => photoDocTask.IsCompleted);

        var photoDoc = photoDocTask.Result;
        if (!photoDoc.Exists || !photoDoc.ContainsField("url")) yield break;
        string photoUrl = photoDoc.GetValue<string>("url");

        yield return UploadToDeedFeed(taskId, prompt, photoUrl);
    }

    private IEnumerator UploadToDeedFeed(string taskId, string prompt, string photoUrl)
    {
        string userId = auth.CurrentUser.UserId;

        // Get user display info
        var userDocTask = db.Collection("userInfo").Document(userId).GetSnapshotAsync();
        yield return new WaitUntil(() => userDocTask.IsCompleted);

        var userDoc = userDocTask.Result;
        string username = userDoc.ContainsField("Username") ? userDoc.GetValue<string>("Username") : "Unknown";
        string profilePicUrl = userDoc.ContainsField("profilePicUrl") ? userDoc.GetValue<string>("profilePicUrl") : "";
        List<string> traits = userDoc.ContainsField("Traits") ? new List<string>(userDoc.GetValue<List<string>>("Traits")) : new List<string>();

        // Create deed
        var deedData = new Dictionary<string, object>
        {
            { "userId", userId },
            { "username", username },
            { "profilePicUrl", profilePicUrl },
            { "prompt", prompt },
            { "photoUrl", photoUrl },
            { "timestamp", Timestamp.GetCurrentTimestamp() },
            { "traits", traits },
            { "reactions", new Dictionary<string, object> { { "like", 0 }, { "heart", 0 }, { "hug", 0 }, { "wow", 0 } } },
            { "taskId", taskId }
        };

        var deedUploadTask = db.Collection("deeds").AddAsync(deedData);
        yield return new WaitUntil(() => deedUploadTask.IsCompleted);
        if (deedUploadTask.IsFaulted || deedUploadTask.IsCanceled) yield break;

        // Persist "already uploaded" on this completion
        var historyRef = db.Collection("userInfo").Document(userId)
                           .Collection("taskHistory").Document(taskId);
        var markTask = historyRef.UpdateAsync(new Dictionary<string, object>
        {
            { "deedUploaded", true },
            { "deedDocId", deedUploadTask.Result.Id }
        });
        yield return new WaitUntil(() => markTask.IsCompleted);

        // Keep session flag in sync
        uploadedTaskIds.Add(taskId);
    }

    // ----------------- Task details & custom task -----------------
    private void ShowTaskDetailPopup(Dictionary<string, object> data)
    {
        if (!taskDetailPopupPrefab || !popupParent) return;

        GameObject popup = Instantiate(taskDetailPopupPrefab, popupParent);
        popup.SetActive(true);

        string textShort = GetString(data, "textShort");
        string textLong = GetString(data, "text");
        string category = GetString(data, "category");
        string length = GetString(data, "length");
        int difficulty = Mathf.Clamp(ParseToInt(GetObj(data, "difficulty")), 1, 4);
        string minAgeStr = GetString(data, "minAge");
        string maxAgeStr = GetString(data, "maxAge");
        bool picture = GetBoolLoose(GetObj(data, "picture"));

        var rawTraits = GetList(data, "traits");
        var rawMaterials = GetList(data, "materials");

        var traits = rawTraits.ConvertAll(t => t.ToString());
        var materials = rawMaterials.ConvertAll(m => m.ToString());

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
        if (!customTaskPopupPrefab || !popupParent) return;

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
                    shortText?.text ?? "",
                    longText?.text ?? "",
                    categoryDropdown != null && categoryDropdown.options.Count > 0
                        ? categoryDropdown.options[categoryDropdown.value].text : "",
                    difficultyDropdown != null && difficultyDropdown.options.Count > 0
                        ? difficultyDropdown.options[difficultyDropdown.value].text : "",
                    imagePath,
                    deedFeedToggle != null && deedFeedToggle.isOn,
                    popup)));
        }

        popup.transform.Find("CloseButton")?.GetComponent<Button>()?.onClick.AddListener(() => Destroy(popup));
    }

    private IEnumerator SubmitCustomTask(string shortText, string longText, string category, string difficulty,
                                         string imagePath, bool postToDeedFeed, GameObject popup)
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
            { "completedAt", Timestamp.GetCurrentTimestamp() },
            { "deedUploaded", false }
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
                { "reactions", new Dictionary<string, object> { { "like", 0 }, { "heart", 0 }, { "hug", 0 }, { "wow", 0 } } },
                { "taskId", taskId }
            };

            var deedUploadTask = db.Collection("deeds").AddAsync(deedData);
            yield return new WaitUntil(() => deedUploadTask.IsCompleted);

            // Mark persisted uploaded flag
            var markTask = historyRef.UpdateAsync(new Dictionary<string, object> {
                { "deedUploaded", true }, { "deedDocId", deedUploadTask.Result.Id }
            });
            yield return new WaitUntil(() => markTask.IsCompleted);
        }

        Destroy(popup);
        LoadTasks();
    }

    // ----------------- Helpers -----------------
    private static object GetObj(Dictionary<string, object> d, string key)
        => d != null && d.ContainsKey(key) ? d[key] : null;

    private static string GetString(Dictionary<string, object> d, string key)
    {
        var v = GetObj(d, key);
        return v == null ? "" : v.ToString();
    }

    private static bool GetBool(Dictionary<string, object> d, string key)
    {
        var v = GetObj(d, key);
        if (v is bool b) return b;
        bool.TryParse(v?.ToString(), out var r);
        return r;
    }

    private static bool GetBoolLoose(object v)
    {
        if (v is bool b) return b;
        var s = v?.ToString().Trim().ToLowerInvariant();
        if (string.IsNullOrEmpty(s)) return false;
        return s == "true" || s == "yes" || s == "y" || s == "1";
    }

    private static int ParseToInt(object v)
    {
        if (v == null) return 0;
        if (v is int i) return i;
        if (v is long l) return (int)l;
        if (v is double d) return (int)d;
        int.TryParse(v.ToString(), out var x);
        return x;
    }

    private static List<object> GetList(Dictionary<string, object> d, string key)
    {
        var v = GetObj(d, key) as List<object>;
        return v ?? new List<object>();
    }

    private static string PrettyLen(string len)
    {
        if (string.IsNullOrEmpty(len)) return "";
        len = len.ToLowerInvariant();
        if (len == "daily") return "Daily";
        if (len == "weekly") return "Weekly";
        if (len == "monthly") return "Monthly";
        return char.ToUpper(len[0]) + len.Substring(1);
    }

    private static string DifficultyName(int d)
        => d == 1 ? "Easy"
         : d == 2 ? "Medium"
         : d == 3 ? "Hard"
         : d == 4 ? "AHHHHH"
         : "?";

    private static string ToTitleCase(string input)
    {
        if (string.IsNullOrEmpty(input)) return "";
        var words = input.Split(' ');
        for (int i = 0; i < words.Length; i++)
        {
            if (words[i].Length > 0)
                words[i] = char.ToUpper(words[i][0]) + words[i].Substring(1).ToLowerInvariant();
        }
        return string.Join(" ", words);
    }

    private static string CapitalizeList(List<string> items)
    {
        return string.Join(", ", items.ConvertAll(item =>
            string.IsNullOrWhiteSpace(item) ? "" :
            char.ToUpper(item[0]) + item.Substring(1).ToLower()));
    }
}