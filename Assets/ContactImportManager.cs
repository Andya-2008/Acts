using UnityEngine;

public class ContactImportManager : MonoBehaviour
{
    public ContactFriendSuggester friendSuggester;

    private bool contactListRequested = false;

    void Start()
    {
        // Set up callback route from the BrainCheck plugin
        BrainCheck.ContactsBridge.setUnityGameObjectNameAndMethodName("UnityReceiveMessage", "CallbackMethod");
    }

    // Call this from your UI button
    public void StartContactImport()
    {
        Debug.Log("📲 Requesting contact permission...");
        contactListRequested = true;
        try
        {
            BrainCheck.ContactsBridge.requestContactsPermission();
        }
        catch (System.Exception ex)
        {
            Debug.LogError("🚨 Failed to request contact permission: " + ex.Message);
        }
    }

    // Called by UnityReceiveMessages.cs once contacts are parsed
    public void OnPermissionResult(bool granted)
    {
        Debug.Log("🔵 [ContactImportManager] OnPermissionResult() called: " + granted);
        if (granted)
        {
            Debug.Log("✅ [ContactImportManager] Fetching contacts...");
            BrainCheck.ContactsBridge.getContactList();
        }
        else
        {
            Debug.LogWarning("🚫 [ContactImportManager] Permission denied. Cannot fetch contacts.");
        }
    }

    public void OnContactsParsed()
    {
        Debug.Log("🟢 [ContactImportManager] OnContactsParsed() called");

        if (!contactListRequested)
        {
            Debug.Log("⚠️ [ContactImportManager] contactListRequested is false — ignoring.");
            return;
        }

        contactListRequested = false;

        if (friendSuggester != null)
        {
            Debug.Log("🎯 [ContactImportManager] Starting friend match...");
            friendSuggester.CheckContactsForFriends();
        }
        else
        {
            Debug.LogWarning("❌ [ContactImportManager] friendSuggester is not assigned!");
        }
    }
}