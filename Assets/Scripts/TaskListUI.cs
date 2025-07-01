using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using Firebase.Storage;
using System.Threading.Tasks;
using System.Collections;
using UnityEngine.Networking;
using System;

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

    private readonly Color dailyColor = new Color(0.75f, 0.9f, 1f);      // Light blue
    private readonly Color weeklyColor = new Color(0.8f, 1f, 0.8f);      // Light green
    private readonly Color monthlyColor = new Color(1f, 0.9f, 0.8f);     // Light orange

    public TMP_Dropdown completionFilterDropdown;

    private enum CompletionFilter { All, Incomplete, Complete }
    private CompletionFilter currentFilter = CompletionFilter.All;

    public GameObject taskDetailPopupPrefab;
    public Transform popupParent;

    public GameObject customTaskPopupPrefab;

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
            case 0:
                currentTaskType = "dailyTask";
                currentDocName = "today";
                break;
            case 1:
                currentTaskType = "weeklyTask";
                currentDocName = "thisWeek";
                break;
            case 2:
                currentTaskType = "monthlyTask";
                currentDocName = "thisMonth";
                break;
            case 3: // "All"
                currentTaskType = "all";
                break;
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
            if (pullDelta < -pullThreshold)
            {
                Debug.Log("🔄 Pull-to-refresh triggered!");
                LoadTasks();
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
                    LoadTasks();
                }
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
    
    private async Task LoadTasksFromDoc(string userId, string taskType, string docName)
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
            string text = data["textShort"].ToString();
            string difficulty = data.ContainsKey("difficulty") ? data["difficulty"].ToString() : "?";
            bool completed = (bool)data["completed"];
            if (currentFilter == CompletionFilter.Complete && !completed) continue;
            if (currentFilter == CompletionFilter.Incomplete && completed) continue;

            GameObject taskGO = Instantiate(taskItemPrefab, taskContainer);
            // Set task type label
            TMP_Text typeText = taskGO.transform.Find("LengthBackground/TaskTypeText")?.GetComponent<TMP_Text>();
            Transform bg = taskGO.transform.Find("Background");
            if (bg != null)
            {
                Button bgButton = bg.GetComponent<Button>();
                if (bgButton == null) bgButton = bg.gameObject.AddComponent<Button>();
                bgButton.onClick.AddListener(() => ShowTaskDetailPopup(data));
            }
                
            if (typeText != null)
            {
                if (taskType == "dailyTask") typeText.text = "Daily";
                else if (taskType == "weeklyTask") typeText.text = "Weekly";
                else if (taskType == "monthlyTask") typeText.text = "Monthly";
                else typeText.text = "";
            }
            // Set background color
            Image background = taskGO.transform.Find("LengthBackground")?.GetComponent<Image>();
            if (background != null)
            {
                if (taskType == "dailyTask") background.color = dailyColor;
                else if (taskType == "weeklyTask") background.color = weeklyColor;
                else if (taskType == "monthlyTask") background.color = monthlyColor;
            }
            taskGO.transform.Find("TaskText").GetComponent<TMP_Text>().text = text;
            taskGO.transform.Find("DifficultyText").GetComponent<TMP_Text>().text = $"Difficulty: {difficulty}";

            var toggleButton = taskGO.transform.Find("ToggleButton").GetComponent<Button>();
            var buttonText = taskGO.transform.Find("ToggleButton/ToggleButtonText").GetComponent<TMP_Text>();
            buttonText.text = completed ? "Complete" : "Incomplete";

            toggleButton.onClick.AddListener(() => ToggleTaskCompletion(taskType, docName, taskId));

            var photoButton = taskGO.transform.Find("PhotoButton").GetComponent<Button>();
            photoButton.interactable = completed;
            if (completed)
            {
                photoButton.onClick.AddListener(() => PickAndUploadTaskPhoto(taskId));
            }

            RawImage image = taskGO.transform.Find("TaskImage").GetComponent<RawImage>();
            LoadTaskPhotoIfExists(taskId, image);

            Button deedButton = taskGO.transform.Find("UploadButton").GetComponent<Button>();
            deedButton.interactable = completed && !uploadedTaskIds.Contains(taskId);
            deedButton.onClick.AddListener(() =>
            {
                if (!uploadedTaskIds.Contains(taskId))
                {
                    uploadedTaskIds.Add(taskId);
                    StartCoroutine(UploadToDeedFeed(taskId, text));
                }
            });
        }
    }
    private void ShowTaskDetailPopup(Dictionary<string, object> data)
    {
        GameObject popup = Instantiate(taskDetailPopupPrefab, popupParent);
        popup.SetActive(true);

        string textShort = data.ContainsKey("textShort") ? data["textShort"].ToString() : "";
        string textLong = data.ContainsKey("text") ? data["text"].ToString() : "";
        string category = data.ContainsKey("category") ? data["category"].ToString() : "";
        string difficulty = data.ContainsKey("difficulty") ? data["difficulty"].ToString() : "?";
        string minAge = data.ContainsKey("minAge") ? data["minAge"].ToString() : "";
        string maxAge = data.ContainsKey("maxAge") ? data["maxAge"].ToString() : "";
        string length = data.ContainsKey("length") ? data["length"].ToString() : "";
        bool picture = data.ContainsKey("picture") && (bool)data["picture"];

        List<object> rawTraits = data.ContainsKey("traits") ? (List<object>)data["traits"] : new List<object>();
        List<object> rawMaterials = data.ContainsKey("materials") ? (List<object>)data["materials"] : new List<object>();

        List<string> traits = rawTraits.ConvertAll(t => t.ToString());
        List<string> materials = rawMaterials.ConvertAll(m => m.ToString());

        popup.transform.Find("HeaderBackground/HeaderText")?.GetComponent<TMP_Text>()?.SetText(textShort);
        popup.transform.Find("DescriptionText")?.GetComponent<TMP_Text>()?.SetText(textLong);
        popup.transform.Find("CategoryText")?.GetComponent<TMP_Text>()?.SetText($"Category: {ToTitleCase(category)}");
        popup.transform.Find("DifficultyText")?.GetComponent<TMP_Text>()?.SetText($"Difficulty: {difficulty}");
        string ageDisplay = int.TryParse(minAge, out int min) && int.TryParse(maxAge, out int max)
    ? (max > 90 ? $"{min}+" : $"{min}–{max}")
    : $"{minAge}–{maxAge}";

        popup.transform.Find("AgeText")?.GetComponent<TMP_Text>()?.SetText($"Target Age Range: {ageDisplay}");

        popup.transform.Find("TraitsText")?.GetComponent<TMP_Text>()?.SetText($"Traits: {CapitalizeList(traits)}");
        popup.transform.Find("MaterialsText")?.GetComponent<TMP_Text>()?.SetText($"Materials: {CapitalizeList(materials)}");
        popup.transform.Find("PictureText")?.GetComponent<TMP_Text>()?.SetText($"Photo Required: {(picture ? "Yes" : "No")}");
        popup.transform.Find("LengthText")?.GetComponent<TMP_Text>()?.SetText($"Type: {ToTitleCase(length)}");

        Button closeBtn = popup.transform.Find("CloseButton")?.GetComponent<Button>();
        if (closeBtn != null)
            closeBtn.onClick.AddListener(() => Destroy(popup));
    }
    public async void ToggleTaskCompletion(string taskType, string docName, string taskId)
    {
        string userId = auth.CurrentUser.UserId;
        var docRef = db.Collection("userInfo").Document(userId).Collection(taskType).Document(docName);
        var docSnap = await docRef.GetSnapshotAsync();

        if (!docSnap.Exists || !docSnap.ContainsField("tasks")) return;

        var rawTasks = docSnap.GetValue<List<object>>("tasks");
        List<Dictionary<string, object>> updatedTasks = new List<Dictionary<string, object>>();

        foreach (var raw in rawTasks)
        {
            var task = raw as Dictionary<string, object>;
            if (task["taskId"].ToString() == taskId)
            {
                bool completed = (bool)task["completed"];
                task["completed"] = !completed;

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
        LoadTasks();
    }

    public void PickAndUploadTaskPhoto(string taskId)
    {
        NativeGallery.GetImageFromGallery(path =>
        {
            if (path != null)
            {
                Texture2D texture = NativeGallery.LoadImageAtPath(path, 1024, false);
                if (texture != null)
                {
                    StartCoroutine(UploadTaskPhoto(taskId, texture));
                }
            }
        }, "Select a photo for your task", "image/*");
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

        Button uploadBtn = popup.transform.Find("UploadButton")?.GetComponent<Button>();
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
            submitBtn.onClick.AddListener(() => StartCoroutine(SubmitCustomTask(
    shortText.text,
    longText.text,
    categoryDropdown.options[categoryDropdown.value].text,
    difficultyDropdown.options[difficultyDropdown.value].text,
    imagePath,
    deedFeedToggle.isOn,
    popup
)));
        }

        popup.transform.Find("CloseButton")?.GetComponent<Button>()?.onClick.AddListener(() => Destroy(popup));
    }

    private IEnumerator SubmitCustomTask(string shortText, string longText, string category, string difficulty, string imagePath, bool postToDeedFeed, GameObject popup)
    {
        string userId = auth.CurrentUser.UserId;
        string taskId = Guid.NewGuid().ToString();
        string photoUrl = "";

        // 🔼 Upload image to Firebase Storage
        if (!string.IsNullOrWhiteSpace(imagePath))
        {
            Texture2D texture = NativeGallery.LoadImageAtPath(imagePath, 1024, false);
            if (texture == null)
            {
                Debug.LogError("❌ Failed to load readable image from gallery.");
                yield break;
            }

            byte[] data = texture.EncodeToPNG();
            var storageRef = storage.GetReference($"task_photos/{userId}/{taskId}.png");
            var uploadTask = storageRef.PutBytesAsync(data);
            yield return new WaitUntil(() => uploadTask.IsCompleted);

            var urlTask = storageRef.GetDownloadUrlAsync();
            yield return new WaitUntil(() => urlTask.IsCompleted);

            if (urlTask.Exception != null)
            {
                Debug.LogError("❌ Failed to get image URL.");
                yield break;
            }

            photoUrl = urlTask.Result.ToString();
        }

        // 🧾 Save to taskHistory
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
            var photoTask = photoRef.SetAsync(new Dictionary<string, object>
        {
            { "url", photoUrl },
            { "uploadedAt", Timestamp.GetCurrentTimestamp() }
        });
            yield return new WaitUntil(() => photoTask.IsCompleted);
        }

        // 🌍 Optional: Upload to Deed Feed
        if (postToDeedFeed)
        {
            var userDocTask = db.Collection("userInfo").Document(userId).GetSnapshotAsync();
            yield return new WaitUntil(() => userDocTask.IsCompleted);

            if (!userDocTask.Result.Exists)
            {
                Debug.LogWarning("⚠️ User document not found.");
            }

            DocumentSnapshot userDoc = userDocTask.Result;
            string username = userDoc.ContainsField("Username") ? userDoc.GetValue<string>("Username") : "Anonymous";
            string profilePicUrl = userDoc.ContainsField("profilePicUrl") ? userDoc.GetValue<string>("profilePicUrl") : "";
            List<string> traits = userDoc.ContainsField("Traits") ? new List<string>(userDoc.GetValue<List<string>>("Traits")) : new List<string>();

            var deedData = new Dictionary<string, object>
        {
            { "userId", userId },
            { "username", username },
            { "profilePicUrl", profilePicUrl },
            { "prompt", shortText },
            { "photoUrl", photoUrl },
            { "timestamp", Timestamp.GetCurrentTimestamp() },
            { "traits", traits },
            { "reactions", new Dictionary<string, object> {
                { "like", 0 }, { "heart", 0 }, { "hug", 0 }, { "wow", 0 }
            }}
        };

            var deedUploadTask = db.Collection("deeds").AddAsync(deedData);
            yield return new WaitUntil(() => deedUploadTask.IsCompleted);

            if (deedUploadTask.Exception != null)
            {
                Debug.LogError("❌ Failed to upload deed: " + deedUploadTask.Exception);
            }
        }

        Destroy(popup);
        LoadTasks(); // refresh UI
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
            Debug.LogError("Failed to upload task photo.");
            yield break;
        }

        var getUrlTask = storageRef.GetDownloadUrlAsync();
        yield return new WaitUntil(() => getUrlTask.IsCompleted);

        if (!getUrlTask.IsFaulted && !getUrlTask.IsCanceled)
        {
            string downloadUrl = getUrlTask.Result.ToString();
            Task saveTask = db.Collection("userInfo").Document(userId)
                .Collection("taskPhotos").Document(taskId)
                .SetAsync(new Dictionary<string, object> {
                    { "url", downloadUrl },
                    { "uploadedAt", Timestamp.GetCurrentTimestamp() }
                });
            yield return new WaitUntil(() => saveTask.IsCompleted);
            var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory").Document(taskId);

            Task saveHistoryUrlTask = historyRef.UpdateAsync(new Dictionary<string, object> {
                { "photoUrl", downloadUrl }
            });

            if (!saveTask.IsFaulted && !saveTask.IsCanceled)
            {
                LoadTasks();
            }
        }
    }

    private async void LoadTaskPhotoIfExists(string taskId, RawImage image)
    {
        string userId = auth.CurrentUser.UserId;
        var photoDoc = await db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();

        if (photoDoc.Exists && photoDoc.ContainsField("url"))
        {
            string url = photoDoc.GetValue<string>("url");
            UnityWebRequest req = UnityWebRequestTexture.GetTexture(url);
            await req.SendWebRequest();

            if (req.result == UnityWebRequest.Result.Success && image != null)
            {
                image.texture = ((DownloadHandlerTexture)req.downloadHandler).texture;
                image.gameObject.SetActive(true);
            }
            else if (image != null && image.gameObject != null)
            {
                image.gameObject.SetActive(false);
            }
        }
        else if (image != null && image.gameObject != null)
        {
            image.gameObject.SetActive(false);
        }
    }

    private IEnumerator UploadToDeedFeed(string taskId, string prompt)
    {
        string userId = auth.CurrentUser.UserId;

        var photoDocTask = db.Collection("userInfo").Document(userId)
            .Collection("taskPhotos").Document(taskId).GetSnapshotAsync();
        yield return new WaitUntil(() => photoDocTask.IsCompleted);

        DocumentSnapshot photoDoc = photoDocTask.Result;
        if (!photoDoc.Exists || !photoDoc.ContainsField("url"))
        {
            Debug.LogWarning("No photo to upload to deed feed.");
            yield break;
        }

        string photoUrl = photoDoc.GetValue<string>("url");

        var userDocTask = db.Collection("userInfo").Document(userId).GetSnapshotAsync();
        yield return new WaitUntil(() => userDocTask.IsCompleted);

        DocumentSnapshot userDoc = userDocTask.Result;
        string username = userDoc.ContainsField("Username") ? userDoc.GetValue<string>("Username") : "Unknown";
        string profilePicUrl = userDoc.ContainsField("profilePicUrl") ? userDoc.GetValue<string>("profilePicUrl") : "";
        List<string> traits = userDoc.ContainsField("Traits") ? new List<string>(userDoc.GetValue<List<string>>("Traits")) : new List<string>();

        Dictionary<string, object> deedData = new Dictionary<string, object>
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

        if (deedUploadTask.Exception != null)
        {
            Debug.LogError("❌ Failed to upload to Deed Feed: " + deedUploadTask.Exception);
        }
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
