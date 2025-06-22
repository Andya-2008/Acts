using TMPro;
using UnityEngine;
using UnityEngine.UI;

public class PersonalityButtonPress : MonoBehaviour
{
    public bool selected = false;
    [SerializeField] GameObject shader;
    public TextMeshProUGUI descriptionText;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public void ShadeButton()
    {
        if (!selected)
        {
            shader.GetComponent<Image>().enabled = true;
            Debug.Log("Shaded");
            selected = true;
        }

        else if (selected)
        {
            shader.GetComponent<Image>().enabled = false;
            Debug.Log("Not shaded");
            selected = false;
        }
    }
}
