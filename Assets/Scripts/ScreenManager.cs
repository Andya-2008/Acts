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
    }
}
