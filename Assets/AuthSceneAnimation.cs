using UnityEngine;
using UnityEngine.Playables;

public class AuthSceneAnimation : MonoBehaviour
{
    [SerializeField] PlayableDirector firstAnimation;
    [SerializeField] PlayableDirector secondAnimation;
    [SerializeField] PlayableDirector thirdAnimation;
    // Start is called once before the first execution of Update after the MonoBehaviour is created
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }
    public void FinishLoadingFirebase()
    {
        Debug.Log("1");
        firstAnimation.Play();
    }
    public void RedirectToLogin()
    {
        Debug.Log("2");
        secondAnimation.Play();
    }
    public void RedirectToRegister()
    {
        Debug.Log("3");
        thirdAnimation.Play();
    }
}
