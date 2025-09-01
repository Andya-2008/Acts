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

    public void StartContactImport()
    {
        Debug.Log("📲 Requesting contact permission...");
        contactListRequested = true;
        try
        {
            BrainCheck.ContactsBridge.setUnityGameObjectNameAndMethodName("UnityReceiveMessage", "CallbackMethod");
            BrainCheck.ContactsBridge.requestContactsPermission();
        }
        catch (System.Exception ex)
        {
            Debug.LogError("🚨 Failed to request contact permission: " + ex.Message);
        }
    }

    public void OnPermissionResult(bool granted)
    {
        Debug.Log("🔵 OnPermissionResult: " + granted);
        if (!granted) { Debug.LogWarning("🚫 Permission denied."); return; }
        StartCoroutine(FetchThenEmitList());
    }

    private System.Collections.IEnumerator FetchThenEmitList()
    {
        Debug.Log("📥 startFetchingRequest()");
        BrainCheck.ContactsBridge.startFetchingRequest();
        yield return new WaitForSeconds(0.5f); // small breath for native side
        Debug.Log("📤 getContactList()");
        BrainCheck.ContactsBridge.getContactList(); // <- this often triggers the ContactList callback
    }

    public bool diagnosticMode = true;

    public void OnContactsParsed()
    {
        Debug.Log("🟢 OnContactsParsed()");
        contactListRequested = false;

        if (friendSuggester == null) { Debug.LogError("❌ friendSuggester not assigned"); return; }

        if (diagnosticMode)
        {
            Debug.Log("🧪 Diagnostic: ShowAllContactsRaw()");
            friendSuggester.ShowAllContactsRaw();   // show EVERYTHING in the container
        }
        else
        {
            friendSuggester.CheckContactsForFriends(); // your real matching flow
        }
        friendSuggester.RunContactsDiagnostics(renderUI: true);
    }
}