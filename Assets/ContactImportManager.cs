using UnityEngine;

public class ContactImportManager : MonoBehaviour
{
    public ContactFriendSuggester friendSuggester;

    private bool contactListRequested = false;

    void Start()
    {
        // Set Unity object + callback handler (do this once)
        BrainCheck.ContactsBridge.setUnityGameObjectNameAndMethodName("UnityReceiveMessage", "CallbackMethod");
    }

    // Call this from a UI Button
    public void StartContactImport()
    {
        Debug.Log("📲 Starting contact import process...");
        contactListRequested = true;

        // Check and request permissions first
        BrainCheck.ContactsBridge.checkContactsPermission();
        BrainCheck.ContactsBridge.requestContactsPermission();

        // Start fetching contacts — callback will be received via UnityReceiveMessages.CallbackMethod
        BrainCheck.ContactsBridge.getContactList();
    }

    // This should be called by UnityReceiveMessages after parsing contacts
    public void OnContactsParsed()
    {
        if (!contactListRequested) return;

        Debug.Log("✅ Contacts parsed. Checking Firebase for matches...");
        contactListRequested = false;

        if (friendSuggester != null)
        {
            friendSuggester.CheckContactsForFriends();
        }
        else
        {
            Debug.LogWarning("❌ ContactFriendSuggester not assigned.");
        }
    }
}