using UnityEngine;
using Firebase.Firestore;
using Firebase.Auth;
using Firebase.Extensions;
using TMPro;
using UnityEngine.UI;
using System.Collections.Generic;
using System.Text.RegularExpressions;
using BrainCheck;
using System.Linq;

public class ContactFriendSuggester : MonoBehaviour
{
    public Transform suggestedContainer;
    public GameObject suggestedFriendPrefab;

    private FirebaseFirestore db;
    private FirebaseAuth auth;

    private void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
    }

    public void CheckContactsForFriends()
    {
        // Clear first
        foreach (Transform child in suggestedContainer) Destroy(child.gameObject);

        var list = UnityReceiveMessages.Instance?.contactList;
        if (list == null || list.Count == 0) { Debug.Log("No contacts."); return; }

        var seenPhones = new HashSet<string>();

        foreach (var c in list)
        {
            string phone = NormalizePhone(c.getNumber());
            if (string.IsNullOrEmpty(phone) || !seenPhones.Add(phone)) continue;

            string contactName = c.getName();

            db.Collection("userInfo").WhereEqualTo("Phone", phone)
              .GetSnapshotAsync().ContinueWithOnMainThread(task =>
              {
                  if (!task.IsCompleted || task.IsFaulted)
                  {
                      Debug.LogWarning("Phone lookup failed for " + phone);
                      return;
                  }

                  if (task.Result.Count > 0)
                  {
                      // Friend is already on Acts → show “Add friend”
                      foreach (var doc in task.Result.Documents)
                      {
                          string targetUserId = doc.Id;
                          string username = doc.ContainsField("Username")
                                        ? doc.GetValue<string>("Username")
                                        : contactName;
                          CreateSuggestedFriendUI(username, contactName, targetUserId);
                      }
                  }
                  else
                  {
                      // Not in DB → show “Invite”
                      CreateInviteUI(contactName, phone);
                  }
              });
        }
    }

    void CreateInviteUI(string contactName, string phoneDigits)
    {
        GameObject go = Instantiate(suggestedFriendPrefab, suggestedContainer);

        var nameText = go.transform.Find("UsernameText")?.GetComponent<TMP_Text>();
        var infoText = go.transform.Find("ContactNameText")?.GetComponent<TMP_Text>();
        var btn = go.transform.Find("AddFriendButton")?.GetComponent<Button>();
        var btnLabel = btn?.transform.Find("Text")?.GetComponent<TMP_Text>();

        if (nameText) nameText.text = contactName;
        if (infoText) infoText.text = $"Invite: ({FormatPhone(phoneDigits)})";

        if (btn && btnLabel)
        {
            btnLabel.text = "Invite";
            btn.onClick.RemoveAllListeners();
            btn.onClick.AddListener(() =>
            {
                // TODO: hook up share/SMS plugin here
                Debug.Log($"Invite tapped for {contactName} {phoneDigits}");
            });
        }
    }

    string NormalizePhone(string raw)
    {
        if (string.IsNullOrEmpty(raw)) return "";
        var digits = System.Text.RegularExpressions.Regex.Replace(raw, @"\D", "");
        if (digits.Length > 10) digits = digits.Substring(digits.Length - 10); // US/NANP
        return digits;
    }

    string FormatPhone(string digits)
    {
        if (digits.Length == 10) return $"({digits.Substring(0, 3)}) {digits.Substring(3, 3)}-{digits.Substring(6, 4)}";
        return digits;
    }


    void CreateSuggestedFriendUI(string username, string contactName, string targetUserId)
    {
        GameObject go = Instantiate(suggestedFriendPrefab, suggestedContainer);
        go.transform.Find("UsernameText").GetComponent<TMP_Text>().text = username;
        go.transform.Find("ContactNameText").GetComponent<TMP_Text>().text = $"In your contacts as: {contactName}";

        Button addButton = go.transform.Find("AddFriendButton").GetComponent<Button>();
        addButton.onClick.AddListener(() =>
        {
            SendFriendRequest(targetUserId);
            addButton.interactable = false;
            addButton.transform.Find("Text").GetComponent<TMP_Text>().text = "Request Sent";
        });
    }

    void SendFriendRequest(string targetUserId)
    {
        string myUserId = auth.CurrentUser.UserId;
        var sentRef = db.Collection("userInfo").Document(myUserId).Collection("friendRequestsSent").Document(targetUserId);
        var receivedRef = db.Collection("userInfo").Document(targetUserId).Collection("friendRequestsReceived").Document(myUserId);

        Dictionary<string, object> request = new Dictionary<string, object> { { "status", "pending" } };
        sentRef.SetAsync(request);
        receivedRef.SetAsync(request);
    }

    public void ShowAllContactsRaw()
    {
        foreach (Transform child in suggestedContainer) Destroy(child.gameObject);

        var list = UnityReceiveMessages.Instance?.contactList;
        Debug.Log($"[Contacts] ShowAllContactsRaw() list count = {(list?.Count ?? 0)}");

        if (list == null || list.Count == 0)
        {
            Debug.LogWarning("[Contacts] No contacts to render.");
            return;
        }

        int shown = 0;
        foreach (var c in list)
        {
            var go = Instantiate(suggestedFriendPrefab, suggestedContainer);

            var nameText = go.transform.Find("UsernameText")?.GetComponent<TMP_Text>()
                          ?? go.transform.Find("DisplayNameText")?.GetComponent<TMP_Text>();
            var phoneText = go.transform.Find("ContactNameText")?.GetComponent<TMP_Text>()
                          ?? go.transform.Find("PhoneText")?.GetComponent<TMP_Text>();

            if (nameText) nameText.text = c.getName();
            if (phoneText) phoneText.text = c.getNumber();

            // don’t rely on button hooks in diagnostic mode
            var addBtn = go.transform.Find("AddFriendButton")?.GetComponent<Button>();
            if (addBtn)
            {
                addBtn.interactable = false;
                var btnLabel = addBtn.transform.Find("Text")?.GetComponent<TMP_Text>();
                if (btnLabel) btnLabel.text = "Invite";
            }

            shown++;
        }
        Debug.Log($"[Contacts] Rendered {shown} rows into suggestedContainer");
    }

    public void RunContactsDiagnostics(bool renderUI = true)
    {
        var list = UnityReceiveMessages.Instance?.contactList;
        if (list == null)
        {
            Debug.LogError("[Contacts] UnityReceiveMessages.Instance.contactList is null");
            return;
        }

        // De-dupe and normalize
        var rows = new List<(string name, string raw, string norm)>();
        var seen = new HashSet<string>();
        int empty = 0, dup = 0;

        foreach (var c in list)
        {
            var raw = c.getNumber();
            var norm = NormalizePhone(raw);
            if (string.IsNullOrEmpty(norm)) { empty++; continue; }
            if (!seen.Add(norm)) { dup++; continue; }
            rows.Add((c.getName(), raw, norm));
        }

        Debug.Log($"[Contacts] Device contacts: total={list.Count}, usable(unique phone)={rows.Count}, empty={empty}, duplicateNumbers={dup}");

        // kick off Firestore check (batched whereIn)
        StartCoroutine(DiagnosticsCoroutine(rows, renderUI));
    }

    private System.Collections.IEnumerator DiagnosticsCoroutine(
        List<(string name, string raw, string norm)> rows, bool renderUI)
    {
        var uniquePhones = rows.Select(r => r.norm).Distinct().ToList();

        // Firestore 'in' is limited to 10 values per query. Chunk by 10.
        IEnumerable<List<string>> ChunkBy10(IEnumerable<string> source)
        {
            var chunk = new List<string>(10);
            foreach (var s in source)
            {
                chunk.Add(s);
                if (chunk.Count == 10) { yield return chunk; chunk = new List<string>(10); }
            }
            if (chunk.Count > 0) yield return chunk;
        }

        var matchedPhones = new HashSet<string>();
        var matchDocs = new Dictionary<string, (string uid, string username)>();
        int pending = 0;

        foreach (var chunk in ChunkBy10(uniquePhones))
        {
            pending++;
            db.Collection("userInfo").WhereIn("Phone", chunk)
              .GetSnapshotAsync().ContinueWithOnMainThread(task =>
              {
                  pending--;
                  if (task.IsFaulted)
                  {
                      Debug.LogWarning("[Contacts] WhereIn query faulted: " + task.Exception);
                      return;
                  }
                  foreach (var doc in task.Result.Documents)
                  {
                      string phone = doc.ContainsField("Phone") ? doc.GetValue<string>("Phone") : null;
                      if (string.IsNullOrEmpty(phone)) continue;
                      string uid = doc.Id;
                      string username = doc.ContainsField("Username") ? doc.GetValue<string>("Username") : "(no username)";
                      matchedPhones.Add(phone);
                      matchDocs[phone] = (uid, username);
                  }
              });
        }

        while (pending > 0) yield return null;

        // Summary + optional UI render
        if (renderUI)
        {
            foreach (Transform child in suggestedContainer) Destroy(child.gameObject);
        }

        int matches = 0, invites = 0;

        foreach (var r in rows)
        {
            bool isMatch = matchedPhones.Contains(r.norm);
            if (isMatch)
            {
                matches++;
                var (uid, uname) = matchDocs[r.norm];
                Debug.Log($"[Contacts] MATCH  | {r.name} | raw:{r.raw} | norm:{r.norm} | user:{uname} ({uid})");
                if (renderUI) CreateSuggestedFriendUI(uname, r.name, uid);
            }
            else
            {
                invites++;
                Debug.Log($"[Contacts] INVITE | {r.name} | raw:{r.raw} | norm:{r.norm}");
                if (renderUI) CreateInviteUI(r.name, r.norm);
            }
        }

        Debug.Log($"[Contacts] Diagnostics summary → matches={matches}, invites={invites}, totalRendered={(matches + invites)} (renderUI={renderUI})");
    }
}