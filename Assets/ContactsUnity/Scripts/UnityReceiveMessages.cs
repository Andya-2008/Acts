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

		void Awake(){
			Instance = this;
			contactList = new List<Contacts>();
		}

		// Use this for initialization
		void Start () {
		}

		// Update is called once per frame
		void Update () {
		}

		public void CallbackMethod(string callback){
			callbackValue = callback;
			textMesh.text = callback;
			passCallbackMessages(callback);
		}

		private void passCallbackMessages(string msg) {

			string[] stringSeparators = new string[] { ":" };
			string[] callbackStatus = msg.Split(stringSeparators, StringSplitOptions.None);
			switch (callbackStatus[0]) {
			case "Permission":
	            switch (callbackStatus[1]) {
	        	case "Permission Granted":
		            print("Permission granted by user for contacts access");
		            break;
	        	case "Permission Not Granted":
		            print("Permission not granted by user for contacts access");
		            break;
		        }
		        break;
	        case "Status":
	            print("Contacts Fetched Successfully.");
	            break;
	        case "ContactList":
	            parseContactLis(msg);
	            break;
	  		case "SelectedContact":
	            string[] stringSeparators1 = new string[] { "##,##" };  
	        	string[] contactDetails = msg.Split(stringSeparators1, StringSplitOptions.None);
	        	Contacts contact = new Contacts();
	       		contact.setName(contactDetails[0]);
	        	contact.setNumber(contactDetails[1]);
	        	selectedContact = contact;
	            break;
			}
		}

        private void parseContactLis(string msg)
        {
            string[] stringSeparators = new string[] { "#####" };
            string[] contacts = msg.Split(stringSeparators, StringSplitOptions.None);
            contactList.Clear();

            for (int i = 0; i < contacts.Length; i++)
            {
                string[] parts = contacts[i].Split(new string[] { "##,##" }, StringSplitOptions.None);
                if (parts.Length < 2) continue;

                Contacts contact = new Contacts();
                contact.setName(parts[0]);
                contact.setNumber(parts[1]);
                contactList.Add(contact);
            }

            Debug.Log("Contacts parsed: " + contactList.Count);

            // Trigger Firebase matching
            FindObjectOfType<ContactImportManager>()?.OnContactsParsed();
        }
    }
}