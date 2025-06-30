using System.Collections.Generic;
using UnityEngine;

public class ScreenManager : MonoBehaviour
{
    public List<CanvasGroup> screens;

    private void Start()
    {
        ShowScreenByIndex(0);
    }
    // This method takes an int index to toggle which screen is shown
    public void ShowScreenByIndex(int screenIndex)
    {
        for (int i = 0; i < screens.Count; i++)
        {
            CanvasGroup screen = screens[i];
            bool isActive = i == screenIndex;

            screen.alpha = isActive ? 1 : 0;
            screen.interactable = isActive;
            screen.blocksRaycasts = isActive;
        }

        // Now that screen is visible, call LoadProfile only if it's the profile screen
        if (screenIndex == 5) // replace with your actual profile screen index
        {
            var profileManager = GameObject.Find("ProfilePageManager");
            if (profileManager != null)
            {
                profileManager.GetComponent<ProfilePageUI>()?.LoadProfile();
            }
        }
    }
}
