using UnityEngine;
using UnityEngine.Playables;

public class AuthSceneAnimation : MonoBehaviour
{
    [SerializeField] PlayableDirector firstAnimation;
    [SerializeField] PlayableDirector secondAnimation;
    [SerializeField] PlayableDirector thirdAnimation;
    [SerializeField] PlayableDirector registerAnimation;
    [SerializeField] PlayableDirector loginAnimation;
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
    public void Registered()
    {
        Debug.Log("3");
        registerAnimation.Play();
    }
    public void Login()
    {
        Debug.Log("3");
        loginAnimation.Play();
    }
    public void ConfigLoader()
    {
        Debug.Log("3");
        GetComponent<PlayableDirector>().Play();
    }
}
