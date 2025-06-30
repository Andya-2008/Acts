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

    private async void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;

        while (auth.CurrentUser == null)
            await Task.Delay(100);

        string userId = auth.CurrentUser.UserId;

        if (await ShouldReassign("dailyTask", "today"))
            await AssignTasks("dailyTask", "today", 3);

        if (await ShouldReassign("weeklyTask", "thisWeek"))
            await AssignTasks("weeklyTask", "thisWeek", 3);

        if (await ShouldReassign("monthlyTask", "thisMonth"))
            await AssignTasks("monthlyTask", "thisMonth", 3);
    }
    public async Task<bool> ShouldReassign(string category, string docName)
    {
        string userId = auth.CurrentUser.UserId;
        var refDoc = db.Collection("userInfo").Document(userId).Collection(category).Document(docName);
        var snap = await refDoc.GetSnapshotAsync();

        if (!snap.Exists || !snap.ContainsField("assignedDate"))
            return true;

        DateTime assignedDate = snap.GetValue<Timestamp>("assignedDate").ToDateTime().ToLocalTime();
        DateTime now = DateTime.Now;

        if (category == "dailyTask") return assignedDate.Date != now.Date;
        if (category == "weeklyTask") return assignedDate.Date < now.Date.AddDays(-7);
        if (category == "monthlyTask") return assignedDate.Month != now.Month || assignedDate.Year != now.Year;

        return false;
    }

    public async Task AssignTasks(string taskType, string userDocName, int count)
    {
        string userId = auth.CurrentUser.UserId;
        var userSnap = await db.Collection("userInfo").Document(userId).GetSnapshotAsync();
        var traits = userSnap.GetValue<List<string>>("Traits");
        string dob = userSnap.GetValue<string>("DOB");
        int age = CalculateAge(dob);

        var historySnap = await db.Collection("userInfo").Document(userId).Collection("taskHistory").GetSnapshotAsync();
        var completed = new HashSet<string>();
        foreach (var doc in historySnap.Documents) completed.Add(doc.Id);

        var allTasks = await db.Collection("tasks").Document(taskType).Collection(taskType)
            .WhereEqualTo("active", true).GetSnapshotAsync();

        List<Dictionary<string, object>> selectedTasks = new List<Dictionary<string, object>>();
        List<DocumentSnapshot> eligible = new List<DocumentSnapshot>();
        System.Random rng = new System.Random();

        foreach (var doc in allTasks.Documents)
        {
            var data = doc.ToDictionary();
            int minAge = Convert.ToInt32(data["minAge"]);
            int maxAge = Convert.ToInt32(data["maxAge"]);
            if (age < minAge || age > maxAge || completed.Contains(doc.Id)) continue;

            var rawTraits = data["traits"] as List<object>;
            List<string> taskTraits = rawTraits.ConvertAll(t => t.ToString());

            if (taskTraits.Contains("Any") || traits.Exists(t => taskTraits.Contains(t)))
                eligible.Add(doc);
        }

        HashSet<int> used = new HashSet<int>();
        while (selectedTasks.Count < Mathf.Min(count, eligible.Count))
        {
            int index = rng.Next(eligible.Count);
            if (used.Contains(index)) continue;
            used.Add(index);

            var doc = eligible[index];
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

        var bundle = new Dictionary<string, object>
    {
        { "tasks", selectedTasks },
        { "assignedDate", Timestamp.GetCurrentTimestamp() }
    };

        await db.Collection("userInfo").Document(userId).Collection(taskType).Document(userDocName).SetAsync(bundle);
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