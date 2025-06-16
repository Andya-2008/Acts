using Firebase.AI;
using UnityEngine;
using System.Threading.Tasks;
using static UnityEngine.ParticleSystem;

public class GeminiTest : MonoBehaviour
{
    async void Start()
    {
        // Initialize the Vertex AI Gemini API backend service
        var ai = FirebaseAI.GetInstance(FirebaseAI.Backend.VertexAI());

        // Create a GenerativeModel instance
        var model = ai.GetGenerativeModel(modelName: "gemini-2.0-flash");

        // Provide a prompt
        var prompt = $"Generate 10 different really really easy acts of service that anybody can do anywhere that correlates with one of the following personality traits: Environmentalist, Introvert" +
                        "Only return the task. Keep it under 30 words. No explanation. Don't include the personality trait. Be specific. Things that take less than 10 minutes.";

        // Generate content
        var response = await model.GenerateContentAsync(prompt);
        Debug.Log(response.Text ?? "No text in response.");
    }
}