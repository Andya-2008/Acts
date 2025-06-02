using UnityEngine;
using i5.Toolkit.Core.OpenIDConnectClient;
using i5.Toolkit.Core.ServiceCore;

public class GoogleSignInOAuth : BaseServiceBootstrapper
{
    [SerializeField] private ClientDataObject googleClientDataObject;
    [SerializeField] private ClientDataObject googleClientDataObjectEditorOnly;
    
    protected override void RegisterServices()
    {
        OpenIDConnectService oidc = new OpenIDConnectService();
        oidc.OidcProvider = new GoogleOidcProvider();
#if !UNITY_EDITOR
        oidc.OidcProvider.ClientData = googleClientDataObject.clientData;
        oidc.RedirectURI = "com.FrogCOO.Acts:/";
#else
        oidc.OidcProvider.ClientData = googleClientDataObjectEditorOnly.clientData;
        oidc.RedirectURI = "https://www.polymuse.tech";
        oidc.ServerListener.ListeningUri = "http://127.0.0.1:52229/";

#endif
        ServiceManager.RegisterService(oidc);
    }

    protected override void UnRegisterServices()
    {
        //throw new System.NotImplementedException();
    }
}
