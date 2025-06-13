using UnityEngine;
using UnityEngine.UI;
using Firebase;
using Firebase.Auth;
using Firebase.Storage;
using System.Threading.Tasks;
using System.IO;

public class ProfilePictureManager : MonoBehaviour
{
    public RawImage profilePictureDisplay;
    private FirebaseAuth auth;
    private FirebaseStorage storage;

    private void Awake()
    {
        auth = FirebaseAuth.DefaultInstance;
        storage = FirebaseStorage.DefaultInstance;
    }

    public void PickAndUploadProfilePicture()
    {
        NativeGallery.GetImageFromGallery((path) =>
        {
            if (path != null)
            {
                Texture2D texture = NativeGallery.LoadImageAtPath(path, maxSize: 512, markTextureNonReadable: false);
                if (texture == null || texture.width < 32 || texture.height < 32)
                {
                    Debug.LogError("Invalid or too small texture. Pick a larger image.");
                    return;
                }
                if (texture != null)
                {
                    profilePictureDisplay.texture = texture;
                    UploadProfilePicture(texture);
                }
            }
        }, "Select a Profile Picture", "image/*");
    }

    public void UploadProfilePicture(Texture2D texture)
    {
        byte[] imageBytes = texture.EncodeToPNG();
        string userId = auth.CurrentUser.UserId;
        string storagePath = $"profile_pictures/{userId}.png";
        StorageReference storageRef = storage.GetReference(storagePath);

        storageRef.PutBytesAsync(imageBytes).ContinueWith(task =>
        {
            if (task.IsFaulted || task.IsCanceled)
                Debug.LogError("Upload failed: " + task.Exception);
            else
                Debug.Log("Upload successful");
        });
    }

    public void LoadProfilePicture()
    {
        string userId = auth.CurrentUser.UserId;
        string storagePath = $"profile_pictures/{userId}.png";
        StorageReference storageRef = storage.GetReference(storagePath);

        storageRef.GetBytesAsync(5 * 1024 * 1024).ContinueWith(task =>
        {
            if (!task.IsFaulted && !task.IsCanceled)
            {
                byte[] fileContents = task.Result;
                Texture2D tex = new Texture2D(2, 2);
                tex.LoadImage(fileContents);
                profilePictureDisplay.texture = tex;
            }
            else
            {
                Debug.LogError("Failed to download profile picture: " + task.Exception);
            }
        });
    }
}