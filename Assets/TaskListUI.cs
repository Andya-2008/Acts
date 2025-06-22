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

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;

        LoadTasks();
    }

    public async void LoadTasks()
    {
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

            // Load existing task photo (if any)
            RawImage image = taskGO.transform.Find("TaskImage").GetComponent<RawImage>();
            LoadTaskPhotoIfExists(taskId, image);
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
                Debug.Log("✅ Task photo uploaded and URL saved.");
                LoadTasks(); // Refresh to show new image
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
}
