using UnityEngine;
using System.Collections;
using System.IO;
using System;
using System.Linq;
using System.Collections.Generic;

namespace BrainCheck {

	public class UnityReceiveMessages : MonoBehaviour {
		public static UnityReceiveMessages Instance;
		public TextMesh textMesh;
		string callbackValue;
		public List<Contacts> contactList;
		Contacts selectedContact;

        void Awake()
        {
            if (Instance != null && Instance != this) { Destroy(gameObject); return; }
            Instance = this;
            contactList = new List<Contacts>();

            // ✅ Ensure the name matches what you register with the bridge
            gameObject.name = "UnityReceiveMessage";
            DontDestroyOnLoad(gameObject);
        }

        // Use this for initialization
        void Start () {
		}

		// Update is called once per frame
		void Update () {
		}

        public void CallbackMethod(string callback)
        {
            if (textMesh != null) textMesh.text = callback; // stays optional
            Debug.Log($"[BrainCheck RAW] {callback}");
            passCallbackMessages(callback);
        }

        private void passCallbackMessages(string msg)
        {
            var mgr = FindObjectOfType<ContactImportManager>();
            var parts = msg.Split(new[] { ":" }, 2, StringSplitOptions.None);
            var tag = parts.Length > 0 ? parts[0] : "";
            var rest = parts.Length > 1 ? parts[1] : "";

            switch (tag)
            {
                case "Permission":
                    bool granted = rest.IndexOf("Granted", StringComparison.OrdinalIgnoreCase) >= 0;
                    if (mgr) mgr.OnPermissionResult(granted);
                    break;

                case "ContactList":
                    parseContactLis(rest); // <- only payload
                    Debug.Log($"[Contacts] Parsed count: {contactList.Count}");
                    if (mgr) mgr.OnContactsParsed();
                    break;

                case "Status":
                    Debug.Log("[Contacts] Status: " + rest);
                    break;
            }
        }

        private void parseContactLis(string payload)
        {
            contactList.Clear();
            var contacts = payload.Split(new[] { "#####" }, StringSplitOptions.RemoveEmptyEntries);
            foreach (var c in contacts)
            {
                var fields = c.Split(new[] { "##,##" }, StringSplitOptions.None);
                if (fields.Length < 2) continue;
                var contact = new Contacts();
                contact.setName(fields[0]);
                contact.setNumber(fields[1]);
                contactList.Add(contact);
            }
        }
    }
}