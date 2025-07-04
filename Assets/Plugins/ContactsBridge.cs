using UnityEngine;
using System.Collections;
using System.Runtime.InteropServices;
using System.IO;

namespace BrainCheck {

	public class ContactsBridge {
		static AndroidJavaClass _class;
		static AndroidJavaObject instance { get { return _class.GetStatic<AndroidJavaObject>("instance"); } }


		private static void SetupPlugin () {
			if (_class == null) {
				_class = new AndroidJavaClass ("com.BrainCheck.contactsPlugin.ContactsPlugin");
				_class.CallStatic ("initiateFragment");
			}
		}

		public static void checkContactsPermission() {
			SetupPlugin ();
	   		instance.Call("checkContactsPermission");
		}

		public static void requestContactsPermission() {
			SetupPlugin ();
	   		instance.Call("requestContactsPermission");
		}

		public static void startFetchingRequest() {
			SetupPlugin ();
	   		instance.Call("startFetchingContacts");
		}

		public static void getContactList() {
			SetupPlugin ();
	   		instance.Call("getContactList");
		}

		public static void setUnityGameObjectNameAndMethodName(string gameObject, string methodName){
			SetupPlugin ();
		   	instance.Call("setUnityGameObjectNameAndMethodName", gameObject, methodName);
		}

		public static void openAddressBook(){
			SetupPlugin ();
		   	instance.Call("openAddresBook");
		}
	}
}