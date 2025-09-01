using System.Collections;
using System.Collections.Generic;
using UnityEngine;

namespace BrainCheck {


	public enum ContactsOptions 
	{
	  checkContactPermission,
	  reqquestContactPermission,
	  fetchContacts,
	  getAllContacts,
	  openAddressBook
	}

	public class DemoScript : MonoBehaviour
	{
		public ContactsOptions myOption;
		string gameObjectName = "UnityReceiveMessage";
		string statusMethodName = "CallbackMethod";

		void OnMouseUp() {
	    	StartCoroutine(BtnAnimation());
	 	}

	 	private IEnumerator BtnAnimation()
	    {
	    	Vector3 originalScale = gameObject.transform.localScale;
	        gameObject.transform.localScale = 0.9f * gameObject.transform.localScale;
	        yield return new WaitForSeconds(0.2f);
	        gameObject.transform.localScale = originalScale;
	        ButtonAction();
	    }

	    private void ButtonAction() {
	    	BrainCheck.ContactsBridge.setUnityGameObjectNameAndMethodName(gameObjectName, statusMethodName);
			switch(myOption) 
			{
			    case ContactsOptions.checkContactPermission:
			      BrainCheck.ContactsBridge.checkContactsPermission();
			      break;
			    case ContactsOptions.reqquestContactPermission:
			      BrainCheck.ContactsBridge.requestContactsPermission();
			      break;
			    case ContactsOptions.fetchContacts:
			      BrainCheck.ContactsBridge.startFetchingRequest();
			      break;
			    case ContactsOptions.getAllContacts:
			      BrainCheck.ContactsBridge.getContactList();
			      break;
			    case ContactsOptions.openAddressBook:
			      BrainCheck.ContactsBridge.openAddressBook();
			      break;
			}
	    }
	}
}
