import api_instance from "../baseApi";

const endpoint = "analyze_image";

export const imageDetection = {
  postImage: function (imageBlob: Blob, filename = "image.png") {
    const formData = new FormData();
    formData.append("file", imageBlob, filename);

    return api_instance.post<unknown>(`${endpoint}`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
  },
};
