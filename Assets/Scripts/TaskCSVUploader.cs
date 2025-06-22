using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic;
using System.IO;

public class TaskCSVUploader : MonoBehaviour
{
    public TextAsset csvFile; // Link this in the Inspector

    void Start()
    {
        UploadTasksFromCSV();
    }

    void UploadTasksFromCSV()
    {
        if (csvFile == null)
        {
            Debug.LogError("CSV file not assigned.");
            return;
        }

        string[] lines = csvFile.text.Split('\n');
        int lineNum = 0;

        foreach (string line in lines)
        {
            if (string.IsNullOrWhiteSpace(line) || lineNum == 0) { lineNum++; continue; }

            string[] values = ParseCSVLine(line);

            if (values.Length < 9)
            {
                Debug.LogWarning($"Skipping incomplete line {lineNum}: {line}");
                lineNum++;
                continue;
            }

            string taskId = values[0].Trim();
            string textShort = values[1].Trim();
            string textLong = values[2].Trim();
            bool active = values[3].Trim().ToLower() == "true";
            string category = values[4].Trim();
            int difficulty = int.Parse(values[5].Trim());
            int minAge = int.Parse(values[6].Trim());
            int maxAge = int.Parse(values[7].Trim());

            string traitsRaw = values[8].Trim();
            List<string> traits = ParseJsonArray(traitsRaw);

            Dictionary<string, object> taskData = new Dictionary<string, object>
        {
            { "text", textLong },
            { "textShort", textShort },
            { "active", active },
            { "category", category },
            { "difficulty", difficulty },
            { "minAge", minAge },
            { "maxAge", maxAge },
            { "traits", traits }
        };

            FirebaseFirestore.DefaultInstance
                .Collection("tasks")
                .Document(taskId)
                .SetAsync(taskData)
                .ContinueWith(task =>
                {
                    if (task.IsCompleted && !task.IsFaulted)
                    { }
                    else
                        Debug.LogError($"[✘] Failed to sync task {taskId}: {task.Exception}");
                });

            lineNum++;
        }
    }

    List<string> ParseJsonArray(string raw)
    {
        var cleaned = raw.Trim().TrimStart('[').TrimEnd(']').Replace("\"", "").Trim();
        return new List<string>(cleaned.Split(','));
    }

    string[] ParseCSVLine(string line)
    {
        // Handles commas inside quotes by splitting smartly
        var values = new List<string>();
        bool inQuotes = false;
        string current = "";

        foreach (char c in line)
        {
            if (c == '"') inQuotes = !inQuotes;
            else if (c == ',' && !inQuotes)
            {
                values.Add(current);
                current = "";
            }
            else current += c;
        }

        values.Add(current); // Add the last value
        return values.ToArray();
    }
}