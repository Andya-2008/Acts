using Firebase.AI; // Use this directive now
using System.Threading.Tasks;
using Firebase.Extensions;
using TMPro; // Example for UI
using UnityEngine;
using Unity.VisualScripting;


public class GeminiTest : MonoBehaviour
{

    private FirebaseAI firebaseAI;
    private GenerativeModel generativeModel;
    [SerializeField] string prompt;
    public string outputText;

    private void Start()
    {
        firebaseAI = FirebaseAI.DefaultInstance;

        if(firebaseAI != null)
        {
            generativeModel = firebaseAI.GetGenerativeModel("gemini-pro");

            if(generativeModel != null)
            {
                Debug.Log("Gemini-Pro model reference obtained.");
            }
            else
            {
                Debug.LogError("Failed to get GenerativeModel instance.");
            }
        }
        OnSendPromptButtonClicked(prompt);
    }
    public void OnSendPromptButtonClicked(string promptInput)
    {
        if (generativeModel == null)
        {
            Debug.LogError("Generative Model is not initialized.");
            return;
        }

        Debug.Log($"Sending prompt: {promptInput}");

        // Send the prompt and handle the response asynchronously
        generativeModel.GenerateContentAsync(promptInput).ContinueWithOnMainThread(task => {
            if (task.IsFaulted)
            {
                Debug.LogError("AI Logic call failed: " + task.Exception);
                outputText = "Error: " + task.Exception.Message;
            }
            else if (task.IsCanceled)
            {
                Debug.LogWarning("AI Logic call was cancelled.");
                outputText = "Operation cancelled.";
            }
            else
            {
                GenerateContentResponse response = task.Result; // Placeholder type
                string generatedText = response.Text; // Access the generated text

                Debug.Log("Generated Text: " + generatedText);
                outputText = generatedText; // Update UI
            }
        });
        Debug.Log("Outputted text:" + outputText);
    }
}