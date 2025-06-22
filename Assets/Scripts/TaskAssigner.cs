using System;
using System.Collections.Generic;
using UnityEngine;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;

public class TaskAssigner : MonoBehaviour
{
    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
    }

    public async Task<bool> ShouldReassignTasksToday()
    {
        string userId = auth.CurrentUser.UserId;
        var todayRef = db.Collection("userInfo").Document(userId).Collection("dailyTask").Document("today");
        var todaySnap = await todayRef.GetSnapshotAsync();

        if (!todaySnap.Exists || !todaySnap.ContainsField("assignedDate"))
        {
            return true;
        }

        Timestamp assignedTimestamp = todaySnap.GetValue<Timestamp>("assignedDate");
        DateTime assignedDate = assignedTimestamp.ToDateTime().ToLocalTime();
        DateTime now = DateTime.Now;

        return assignedDate.Date != now.Date;
    }

    public async Task AssignTaskForToday()
    {
        string userId = auth.CurrentUser.UserId;
        var todayRef = db.Collection("userInfo").Document(userId).Collection("dailyTask").Document("today");

        var userSnap = await db.Collection("userInfo").Document(userId).GetSnapshotAsync();
        var traits = userSnap.GetValue<List<string>>("Traits");
        string dob = userSnap.GetValue<string>("DOB");
        int age = CalculateAge(dob);

        var historySnap = await db.Collection("userInfo").Document(userId).Collection("taskHistory").GetSnapshotAsync();
        var completed = new HashSet<string>();
        foreach (var doc in historySnap.Documents) completed.Add(doc.Id);

        var allTasks = await db.Collection("tasks").WhereEqualTo("active", true).GetSnapshotAsync();
        List<DocumentSnapshot> eligibleTasks = new List<DocumentSnapshot>();

        foreach (var doc in allTasks.Documents)
        {
            var data = doc.ToDictionary();
            int minAge = Convert.ToInt32(data["minAge"]);
            int maxAge = Convert.ToInt32(data["maxAge"]);
            if (age < minAge || age > maxAge || completed.Contains(doc.Id)) continue;

            List<object> rawTraits = data["traits"] as List<object>;
            List<string> taskTraits = rawTraits.ConvertAll(t => t.ToString());

            if (taskTraits.Contains("Any") || traits.Exists(t => taskTraits.Contains(t)))
            {
                eligibleTasks.Add(doc);
            }
        }

        if (eligibleTasks.Count == 0) return;

        int taskCount = Mathf.Min(3, eligibleTasks.Count);
        List<Dictionary<string, object>> selectedTasks = new List<Dictionary<string, object>>();
        HashSet<int> usedIndexes = new HashSet<int>();
        System.Random rng = new System.Random();

        while (selectedTasks.Count < taskCount)
        {
            int index = rng.Next(eligibleTasks.Count);
            if (usedIndexes.Contains(index)) continue;
            usedIndexes.Add(index);

            var doc = eligibleTasks[index];
            var data = doc.ToDictionary();

            selectedTasks.Add(new Dictionary<string, object>
            {
                { "taskId", doc.Id },
                { "text", data["text"] },
                { "textShort", data["textShort"] },
                { "difficulty", data["difficulty"] },
                { "completed", false }
            });
        }

        var taskBundle = new Dictionary<string, object>
        {
            { "tasks", selectedTasks },
            { "assignedDate", Timestamp.GetCurrentTimestamp() }
        };

        await todayRef.SetAsync(taskBundle);
    }

    private int CalculateAge(string dob)
    {
        DateTime birth = DateTime.Parse(dob);
        DateTime now = DateTime.Now;
        int age = now.Year - birth.Year;
        if (birth > now.AddYears(-age)) age--;
        return age;
    }
}