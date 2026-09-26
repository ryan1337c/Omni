import { AuthServices } from "@/lib/authServices";

const authServices = new AuthServices();

export async function generateImageRequest(prompt: string) {
  const session = await authServices.getSession();
  const response = await fetch("../api/generateImage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      prompt,
    }),
  });

  const data = await response.json();
  return { response, data };
}

export async function generateChatRequest(formData: FormData) {
  const session = await authServices.getSession();
  const response = await fetch("../api/generate", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${session.access_token}`,
    },
    body: formData,
  });

  const data = await response.json();
  return { response, data };
}

export async function downloadImage(imageUrl: string) {
  try {
    let downloadUrl = imageUrl;

    if (!imageUrl.startsWith("data:") && !imageUrl.startsWith("blob:")) {
      const session = await authServices.getSession();
      const response = await fetch(
        `/api/proxy-image?url=${encodeURIComponent(imageUrl)}`,
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        },
      );
      if (!response.ok) throw new Error("Failed to fetch image proxy");

      const blob = await response.blob();
      downloadUrl = URL.createObjectURL(blob);
    }

    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = "generated-image.png";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    if (downloadUrl !== imageUrl) {
      URL.revokeObjectURL(downloadUrl);
    }
  } catch (error) {
    console.error("Download failed:", error);
  }
}
