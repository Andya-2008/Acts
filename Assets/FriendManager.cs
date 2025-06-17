// Firestore structure we'll use:
// userInfo/{userId}/friends/{friendUserId} => { status: "pending" | "accepted" | "rejected" }
// userInfo/{userId}/friendRequestsReceived/{senderUserId} => { status: "pending" }
// userInfo/{userId}/friendRequestsSent/{receiverUserId} => { status: "pending" }

using System.Collections.Generic;
using UnityEngine;
using Firebase.Firestore;
using Firebase.Auth;
using System.Threading.Tasks;

public class FriendManager : MonoBehaviour
{
    private FirebaseFirestore db;
    private FirebaseAuth auth;

    void Start()
    {
        db = FirebaseFirestore.DefaultInstance;
        auth = FirebaseAuth.DefaultInstance;
    }

    public async Task SendFriendRequest(string targetUserId)
    {
        string myUserId = auth.CurrentUser.UserId;

        var sentRef = db.Collection("userInfo").Document(myUserId).Collection("friendRequestsSent").Document(targetUserId);
        var receivedRef = db.Collection("userInfo").Document(targetUserId).Collection("friendRequestsReceived").Document(myUserId);

        Dictionary<string, object> request = new Dictionary<string, object> { { "status", "pending" } };

        await sentRef.SetAsync(request);
        await receivedRef.SetAsync(request);

        Debug.Log($"✅ Friend request sent to {targetUserId}");
    }

    public async Task AcceptFriendRequest(string senderUserId)
    {
        string myUserId = auth.CurrentUser.UserId;

        var myFriendRef = db.Collection("userInfo").Document(myUserId).Collection("friends").Document(senderUserId);
        var theirFriendRef = db.Collection("userInfo").Document(senderUserId).Collection("friends").Document(myUserId);

        var updates = new Dictionary<string, object> { { "status", "accepted" } };

        await myFriendRef.SetAsync(updates);
        await theirFriendRef.SetAsync(updates);

        // Delete requests
        await db.Collection("userInfo").Document(myUserId).Collection("friendRequestsReceived").Document(senderUserId).DeleteAsync();
        await db.Collection("userInfo").Document(senderUserId).Collection("friendRequestsSent").Document(myUserId).DeleteAsync();

        Debug.Log($"🤝 Friend request accepted from {senderUserId}");
    }

    public async Task RejectFriendRequest(string senderUserId)
    {
        string myUserId = auth.CurrentUser.UserId;

        await db.Collection("userInfo").Document(myUserId).Collection("friendRequestsReceived").Document(senderUserId).UpdateAsync(new Dictionary<string, object> { { "status", "rejected" } });
        await db.Collection("userInfo").Document(senderUserId).Collection("friendRequestsSent").Document(myUserId).UpdateAsync(new Dictionary<string, object> { { "status", "rejected" } });

        Debug.Log($"❌ Friend request rejected from {senderUserId}");
    }

    public async Task<List<string>> GetAcceptedFriends()
    {
        string myUserId = auth.CurrentUser.UserId;
        var snapshot = await db.Collection("userInfo").Document(myUserId).Collection("friends").GetSnapshotAsync();

        List<string> acceptedFriends = new List<string>();
        foreach (var doc in snapshot.Documents)
        {
            var data = doc.ToDictionary();
            if (data.ContainsKey("status") && data["status"].ToString() == "accepted")
            {
                acceptedFriends.Add(doc.Id);
            }
        }
        return acceptedFriends;
    }
}
