using UnityEngine;
using UnityEngine.UI;

public class PersonalityButtonPress : MonoBehaviour
{
    bool shaded = false;
    [SerializeField] GameObject shader;
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
        if (!shaded)
        {
            //shader.GetComponent<Image>().enabled = true;
            Debug.Log("Shaded");
            shaded = true;
        }

        else if (shaded)
        {
            //shader.GetComponent<Image>().enabled = false;
            Debug.Log("Not shaded");
            shaded = false;
        }
    }
}
