using UnityEngine;
using UnityEngine.UI;
using Firebase;
using Firebase.Auth;
using Firebase.Storage;
using System.Threading.Tasks;
using System.IO;
using Firebase.Firestore;
using System.Collections.Generic;
using System;

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
                Texture2D originalTexture = NativeGallery.LoadImageAtPath(path, 1024, false);
                if (originalTexture == null)
                {
                    Debug.LogError("Failed to load image from path.");
                    return;
                }

                // Now launch the cropping UI with the loaded texture
                ImageCropper.Instance.Show(
    originalTexture,
    (bool result, Texture originalImage, Texture2D croppedTexture) =>
    {
        if (!result || croppedTexture == null)
        {
            Debug.LogWarning("User cancelled cropping.");
            return;
        }

        if (croppedTexture.width < 32 || croppedTexture.height < 32)
        {
            Debug.LogError("Cropped image too small.");
            return;
        }

        profilePictureDisplay.texture = croppedTexture;
        UploadProfilePicture(croppedTexture);
    },
    new ImageCropper.Settings()
    {
        selectionMinAspectRatio = 1f,
        selectionMaxAspectRatio = 1f,
        ovalSelection = true,
        autoZoomEnabled = true,
        markTextureNonReadable = false
    }
);
            }
        }, "Select a Profile Picture", "image/*");
    }

    public async void UploadProfilePicture(Texture2D texture)
    {
        byte[] imageBytes = texture.EncodeToPNG();
        string userId = auth.CurrentUser.UserId;
        string storagePath = $"profile_pictures/{userId}.png";
        StorageReference storageRef = storage.GetReference(storagePath);

        try
        {
            // Upload image bytes
            await storageRef.PutBytesAsync(imageBytes);
            Debug.Log("✅ Upload successful");

            // Get download URL
            Uri uri = await storageRef.GetDownloadUrlAsync();
            string downloadUrl = uri.ToString();
            Debug.Log("✅ Download URL: " + downloadUrl);

            // Save URL to Firestore
            FirebaseFirestore db = FirebaseFirestore.DefaultInstance;
            await db.Collection("userInfo").Document(userId).UpdateAsync(new Dictionary<string, object>
        {
            { "profilePicUrl", downloadUrl }
        });

            Debug.Log("✅ Firestore updated with profilePicUrl");
        }
        catch (System.Exception ex)
        {
            Debug.LogError("❌ Upload failed: " + ex.Message);
        }
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