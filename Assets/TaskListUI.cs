using System.Collections.Generic;
using UnityEngine;
using UnityEngine.UI;
using TMPro;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;

public class TaskListUI : MonoBehaviour
{
    public GameObject taskItemPrefab;
    public Transform taskContainer;
    public TaskAssigner taskManager;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    async void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        bool shouldAssign = await taskManager.ShouldReassignTasksToday();
        if (shouldAssign)
        {
            await taskManager.AssignTaskForToday();
        }

        await LoadTasks();
    }

    public async Task LoadTasks()
    {
        foreach (Transform child in taskContainer) Destroy(child.gameObject);

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
            string text = data.ContainsKey("textShort") ? data["textShort"].ToString() : "(No Text)";
            string difficulty = data.ContainsKey("difficulty") ? data["difficulty"].ToString() : "?";
            bool completed = data.ContainsKey("completed") && (bool)data["completed"];

            GameObject taskGO = Instantiate(taskItemPrefab, taskContainer);
            taskGO.transform.Find("TaskText").GetComponent<TMP_Text>().text = text;
            taskGO.transform.Find("DifficultyText").GetComponent<TMP_Text>().text = $"Difficulty: {difficulty}";

            var toggleButton = taskGO.transform.Find("ToggleButton").GetComponent<Button>();
            var buttonText = taskGO.transform.Find("ToggleButton/ToggleButtonText").GetComponent<TMP_Text>();
            buttonText.text = completed ? "Complete" : "Incomplete";

            toggleButton.interactable = true;
            toggleButton.onClick.AddListener(async () =>
            {
                await ToggleTaskCompletion(taskId);
                await LoadTasks();
            });
        }
    }

    public async Task ToggleTaskCompletion(string taskId)
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
            if (task == null || !task.ContainsKey("taskId")) continue;

            if (task["taskId"].ToString() == taskId)
            {
                bool completed = (bool)task["completed"];
                task["completed"] = !completed;

                var historyRef = db.Collection("userInfo").Document(userId).Collection("taskHistory").Document(taskId);

                if (!completed)
                {
                    await historyRef.SetAsync(new Dictionary<string, object>
                    {
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

        await docRef.UpdateAsync(new Dictionary<string, object>
        {
            { "tasks", updatedTasks }
        });
    }
}
