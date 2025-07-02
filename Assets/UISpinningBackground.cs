using UnityEngine;

public class UISpinningBackground : MonoBehaviour
{
    [SerializeField] float spinSpeed;
    [SerializeField] Canvas myCanvas;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        DontDestroyOnLoad(myCanvas.gameObject);
    }

    // Update is called once per frame
    void Update()
    {
        GetComponent<RectTransform>().Rotate(0, 0, spinSpeed * Time.deltaTime);
    }
}
