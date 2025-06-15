using UnityEngine;
using TMPro;
public class TMP_InputFieldPhoneNumberValidator : MonoBehaviour
{
    public TMP_InputField phoneNumberField;
    private void Start()
    {
        phoneNumberField.onValueChanged.AddListener(phoneValueChanged);
    }
    private void phoneValueChanged(string svalue)
    {
        Debug.Log("phoneValueChanged " + svalue);
        //first strip all non-numeric values. Here I use a regex to strip out any non-numeric values. This could be done multiple different ways, I just chose regex for brevity.
        string snum = System.Text.RegularExpressions.Regex.Replace(svalue, @"[^0-9]", string.Empty) ?? string.Empty;
        //now ensure is less than max number count in a US phone number. In this example it's 10 as we don't allow the US country code (leading 1)
        if (snum.Length > 11) snum = snum.Substring(0, 11);
        //now format according to custom rules
        if (snum.Length < 3)
        {
            //do nothing
        }
        else if (snum.Length == 3)
        {
            snum = $"{snum}";
        }
        else if (snum.Length <= 6)
        {
            snum = $"({snum.Substring(0, 3)}) {snum.Substring(3, snum.Length - 3)}";
        }
        else if (snum.Length <= 10)
        {
            snum = $"({snum.Substring(0, 3)}) {snum.Substring(3, 3)} - {snum.Substring(6, snum.Length - 6)}";
        }
        else
        {
            snum = $"+{snum.Substring(0, 1)} ({snum.Substring(1, 3)}) {snum.Substring(4, 3)} - {snum.Substring(7, snum.Length - 7)}";
        }
        phoneNumberField.text = snum;
        //Here I just move the caret to the end if we changed the text length. You could write some other behavior if you desired.
        if (snum.Length != svalue.Length)
        {
            phoneNumberField.ForceLabelUpdate();
            phoneNumberField.MoveTextEnd(false);
        }
    }
}