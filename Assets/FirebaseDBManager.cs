using UnityEngine;
using Firebase.Firestore;
using System.Collections.Generic; // Needed for Dictionary
using Firebase.Extensions; // Needed for ContinueWithOnMainThread

public class FirebaseDBManager : MonoBehaviour
{
    private FirebaseFirestore db;

    void Start()
    {
        // Get the Firestore instance
        db = FirebaseFirestore.DefaultInstance;

        // Example: Add a document when the script starts (you'd do this on a button click or event)
        AddSampleData();
    }

    void AddSampleData()
    {
        // Create a new document with some data
        Dictionary<string, object> data = new Dictionary<string, object>
        {
            { "name", "Sample Item" },
            { "description", "This is a description for the item" },
            { "quantity", 10 }
        };
        Debug.Log(1);
        // Get a reference to the collection and add the new document
        db.Collection("test") // Replace "myAwesomeData" with your collection name
            .AddAsync(data)
            .ContinueWithOnMainThread(task =>
            {
                Debug.Log(2);
                if (task.IsCompleted)
                {
                    Debug.Log("Task completed");
                    // Success! The document was added.
                    // task.Result is a DocumentReference to the new document
                    Debug.Log("Document added with ID: " + task.Result.Id);
                }
                else if (task.IsFaulted)
                {
                    Debug.Log(5);
                    // Uh oh, there was an error
                    Debug.LogError("Error adding document: " + task.Exception);
                }
                Debug.Log(6);
            });
        Debug.Log(7);
    }
}