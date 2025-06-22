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
using System.IO;

public class TaskListUI : MonoBehaviour
{
    public GameObject taskItemPrefab;
    public Transform taskContainer;

    private FirebaseFirestore db;
    private FirebaseAuth auth;
    private FirebaseStorage storage;
    private HashSet<string> uploadedTaskIds = new HashSet<string>();

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;

        LoadTasks();
    }

    public async void LoadTasks()
    {
        uploadedTaskIds.Clear();

        foreach (Transform child in taskContainer)
            Destroy(child.gameObject);

        string userId = auth.CurrentUser.UserId;
        var docRef = db.Collection("userInfo").Document(userId).Collection("dailyTask").Document("today");
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

            GameObject taskGO = Instantiate(taskItemPrefab, taskContainer);
            taskGO.transform.Find("TaskText").GetComponent<TMP_Text>().text = text;
            taskGO.transform.Find("DifficultyText").GetComponent<TMP_Text>().text = $"Difficulty: {difficulty}";

            var toggleButton = taskGO.transform.Find("ToggleButton").GetComponent<Button>();
            var buttonText = taskGO.transform.Find("ToggleButton/ToggleButtonText").GetComponent<TMP_Text>();
            buttonText.text = completed ? "Complete" : "Incomplete";

            toggleButton.onClick.AddListener(() => ToggleTaskCompletion(taskId));

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

    public async void ToggleTaskCompletion(string taskId)
    {
        string userId = auth.CurrentUser.UserId;
        var docRef = db.Collection("userInfo").Document(userId).Collection("dailyTask").Document("today");
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
                        { "completedAt", Timestamp.GetCurrentTimestamp() }
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

            if (saveTask.IsFaulted || saveTask.IsCanceled)
            {
                Debug.LogError("Failed to save task photo URL to Firestore.");
            }
            else
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
                if (image != null)
                {
                    image.texture = ((DownloadHandlerTexture)req.downloadHandler).texture;
                    if (image.gameObject != null)
                        image.gameObject.SetActive(true);
                }
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
}
