using UnityEngine;
using UnityEngine.UI;
using TMPro;

/// Icons ARE the buttons. Assign the four icon GameObjects (each should have an Image and a Button).
public class TaskCardView : MonoBehaviour
{
    [Header("Roots (flip complete/incomplete)")]
    [SerializeField] private GameObject incompleteRoot;
    [SerializeField] private GameObject completeRoot;

    [Header("Primary texts")]
    [SerializeField] private TMP_Text taskText;
    [SerializeField] private TMP_Text toggleButtonText;

    [Header("Optional labels")]
    [SerializeField] private TMP_Text typeText;        // Daily/Weekly/Monthly
    [SerializeField] private TMP_Text difficultyText;  // Difficulty: …

    [Header("Length chips (Incomplete)")]
    [SerializeField] private GameObject lengthDaily;
    [SerializeField] private GameObject lengthWeekly;
    [SerializeField] private GameObject lengthMonthly;

    [Header("Difficulty chips (Incomplete)")]
    [SerializeField] private GameObject diff1;
    [SerializeField] private GameObject diff2;
    [SerializeField] private GameObject diff3;
    [SerializeField] private GameObject diff4;

    [Header("Photo recommended chip (Incomplete)")]
    [SerializeField] private GameObject photoYes;
    [SerializeField] private GameObject photoNo;

    [Header("Complete / Photo ICONS (clickable)")]
    [SerializeField] private GameObject photoUploaded;     // visible when hasPhoto
    [SerializeField] private GameObject photoNotUploaded;  // visible when !hasPhoto

    [Header("Complete / Deed ICONS (clickable)")]
    [SerializeField] private GameObject deedFeedUploaded;      // visible when deed already uploaded
    [SerializeField] private GameObject deedFeedNotUploaded;   // visible when can upload (or not yet uploaded)

    [Header("Other controls")]
    [SerializeField] private Button toggleButton;      // complete/incomplete
    [SerializeField] private Button backgroundButton;  // open details

    // cached icon buttons
    Button _photoUploadedBtn, _photoNotUploadedBtn, _deedUploadedBtn, _deedNotUploadedBtn;

    void Awake()
    {
        // Optional warnings if something's missing
        if (!completeRoot || !incompleteRoot) Debug.LogWarning($"[TaskCardView] Roots not set on {name}");

        // Cache icon buttons if present (recommended)
        if (photoUploaded) photoUploaded.TryGetComponent(out _photoUploadedBtn);
        if (photoNotUploaded) photoNotUploaded.TryGetComponent(out _photoNotUploadedBtn);
        if (deedFeedUploaded) deedFeedUploaded.TryGetComponent(out _deedUploadedBtn);
        if (deedFeedNotUploaded) deedFeedNotUploaded.TryGetComponent(out _deedNotUploadedBtn);
    }

    // ---------- Public API ----------
    public void SetTaskText(string t) { if (taskText) taskText.text = t; }
    public void SetTypeLabel(string t) { if (typeText) typeText.text = t; }
    public void SetDifficultyLabel(string t) { if (difficultyText) difficultyText.text = t; }

    public void SetCompletedUI(bool isCompleted)
    {
        if (incompleteRoot) incompleteRoot.SetActive(!isCompleted);
        if (completeRoot) completeRoot.SetActive(isCompleted);
        if (toggleButtonText) toggleButtonText.text = isCompleted ? "Complete" : "Incomplete";
    }

    public void SetLengthChip(string lenLower)
    {
        if (lengthDaily) lengthDaily.SetActive(lenLower == "daily");
        if (lengthWeekly) lengthWeekly.SetActive(lenLower == "weekly");
        if (lengthMonthly) lengthMonthly.SetActive(lenLower == "monthly");
    }

    public void SetDifficultyChip(int diff)
    {
        if (diff1) diff1.SetActive(diff == 1);
        if (diff2) diff2.SetActive(diff == 2);
        if (diff3) diff3.SetActive(diff == 3);
        if (diff4) diff4.SetActive(diff == 4);
    }

    public void SetPhotoRecommended(bool yes)
    {
        if (photoYes) photoYes.SetActive(yes);
        if (photoNo) photoNo.SetActive(!yes);
    }

    /// PHOTO ROW (icons as the buttons)
    /// taskCompleted: card is on Complete side
    /// hasPhoto: whether the current completion has a photo
    public void SetPhotoState(bool taskCompleted, bool hasPhoto)
    {
        bool show = taskCompleted;  // show photo icons only when completed
        if (photoUploaded) photoUploaded.SetActive(show && hasPhoto);
        if (photoNotUploaded) photoNotUploaded.SetActive(show && !hasPhoto);

        // Click should only be possible on "photoNotUploaded" when we can add a photo
        if (_photoUploadedBtn) _photoUploadedBtn.interactable = false; // nothing to do
        if (_photoNotUploadedBtn) _photoNotUploadedBtn.interactable = taskCompleted && !hasPhoto;
        SetIconRaycast(photoUploaded, false);
        SetIconRaycast(photoNotUploaded, taskCompleted && !hasPhoto);
    }

    /// DEED ROW (icons as the buttons)
    /// uploaded: deed feed already posted this completion
    /// canUpload: completed && hasPhoto && !uploaded
    public void SetDeedFeedState(bool taskCompleted, bool hasPhoto, bool uploaded, bool canUpload)
    {
        // Show deed icons only when completed (so user sees "not uploaded" state early)
        bool show = taskCompleted;
        if (deedFeedUploaded) deedFeedUploaded.SetActive(show && uploaded);
        if (deedFeedNotUploaded) deedFeedNotUploaded.SetActive(show && !uploaded);

        // Click only on "deedFeedNotUploaded" when canUpload
        if (_deedUploadedBtn) _deedUploadedBtn.interactable = false;
        if (_deedNotUploadedBtn) _deedNotUploadedBtn.interactable = canUpload;
        SetIconRaycast(deedFeedUploaded, false);
        SetIconRaycast(deedFeedNotUploaded, canUpload);
    }

    public void OnToggleClicked(System.Action cb)
    {
        if (!toggleButton) return;
        toggleButton.onClick.RemoveAllListeners();
        toggleButton.onClick.AddListener(() => cb?.Invoke());
    }

    public void OnPhotoIconClicked(System.Action cb)
    {
        // Bind to both; only the visible & interactable one will receive clicks
        if (_photoUploadedBtn)
        {
            _photoUploadedBtn.onClick.RemoveAllListeners();
            _photoUploadedBtn.onClick.AddListener(() => cb?.Invoke());
        }
        if (_photoNotUploadedBtn)
        {
            _photoNotUploadedBtn.onClick.RemoveAllListeners();
            _photoNotUploadedBtn.onClick.AddListener(() => cb?.Invoke());
        }
    }

    public void OnDeedIconClicked(System.Action cb)
    {
        if (_deedUploadedBtn)
        {
            _deedUploadedBtn.onClick.RemoveAllListeners();
            _deedUploadedBtn.onClick.AddListener(() => cb?.Invoke());
        }
        if (_deedNotUploadedBtn)
        {
            _deedNotUploadedBtn.onClick.RemoveAllListeners();
            _deedNotUploadedBtn.onClick.AddListener(() => cb?.Invoke());
        }
    }

    public void OnBackgroundClicked(System.Action cb)
    {
        if (!backgroundButton) return;
        backgroundButton.onClick.RemoveAllListeners();
        backgroundButton.onClick.AddListener(() => cb?.Invoke());
    }

    public bool IsCompleteVisible() => completeRoot && completeRoot.activeSelf;

    // --- helpers ---
    private void SetIconRaycast(GameObject go, bool enabled)
    {
        if (!go) return;
        if (go.TryGetComponent<Image>(out var img)) img.raycastTarget = enabled;
        if (go.TryGetComponent<Button>(out var btn)) btn.interactable = enabled;
        if (go.TryGetComponent<CanvasGroup>(out var cg)) { cg.blocksRaycasts = enabled; cg.interactable = enabled; }
    }
}
