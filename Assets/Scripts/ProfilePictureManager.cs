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

                        // Apply circular mask
                        Texture2D masked = ApplyCircularMask(croppedTexture);
                        profilePictureDisplay.texture = masked;

                        // Upload
                        UploadProfilePicture(masked);
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
            await storageRef.PutBytesAsync(imageBytes);
            Uri uri = await storageRef.GetDownloadUrlAsync();
            string downloadUrl = uri.ToString();

            FirebaseFirestore db = FirebaseFirestore.DefaultInstance;
            await db.Collection("userInfo").Document(userId).UpdateAsync(new Dictionary<string, object>
            {
                { "profilePicUrl", downloadUrl }
            });
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

    private Texture2D ApplyCircularMask(Texture2D source)
    {
        int width = source.width;
        int height = source.height;
        Texture2D masked = new Texture2D(width, height, TextureFormat.RGBA32, false);

        Color32[] pixels = source.GetPixels32();
        Color32[] maskedPixels = new Color32[pixels.Length];

        float centerX = width / 2f;
        float centerY = height / 2f;
        float radius = Mathf.Min(width, height) / 2f;

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                int index = y * width + x;
                float dx = x - centerX;
                float dy = y - centerY;
                float distance = Mathf.Sqrt(dx * dx + dy * dy);

                if (distance <= radius)
                {
                    maskedPixels[index] = pixels[index]; // Keep pixel
                }
                else
                {
                    maskedPixels[index] = new Color32(0, 0, 0, 0); // Transparent
                }
            }
        }

        masked.SetPixels32(maskedPixels);
        masked.Apply();
        return masked;
    }
}