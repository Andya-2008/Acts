using System.Collections;
using System.Collections.Generic;
using UnityEngine;


namespace BrainCheck {
	public class Contacts 
	{
		string name;
		string phoneNumber;

		public void setName(string name) {
			this.name = name;
		}

		public void setNumber(string phoneNumber) {
			this.phoneNumber = phoneNumber;
		}

		public string getName() {
			return this.name;
		}

		public string getNumber() {
			return this.phoneNumber;
		}
	}
}
