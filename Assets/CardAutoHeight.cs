using UnityEngine;
using UnityEngine.UI;
using TMPro;

[RequireComponent(typeof(LayoutElement))]
public class CardAutoHeight : MonoBehaviour
{
    public TMP_Text prompt;
    public float topBottomPadding = 40f;   // total vertical padding inside the card
    public float minHeight = 180f;         // safety floor
    public float maxHeight = 480f;         // safety cap

    LayoutElement le;

    void Awake()
    {
        le = GetComponent<LayoutElement>();
    }

    void OnEnable()
    {
        Refresh();
    }

#if UNITY_EDITOR
    void OnValidate()
    {
        if (isActiveAndEnabled) Refresh();
    }
#endif

    public void Refresh()
    {
        if (prompt == null) return;
        // Force TMP to update its preferred values
        prompt.ForceMeshUpdate();
        float h = prompt.preferredHeight + topBottomPadding;
        le.preferredHeight = Mathf.Clamp(h, minHeight, maxHeight);
    }
}