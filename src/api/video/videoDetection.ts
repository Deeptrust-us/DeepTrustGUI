import api_instance from "../baseApi";

const endpoint = "analyze_video";

export const videoDetection = {
  // Post video blob to the backend
  postVideo: function (videoBlob: Blob) {
    const formData = new FormData();
    formData.append("file", videoBlob, "recording.webm");

    return api_instance.post<any>( // any instead of scanresult
      `${endpoint}`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000, // 60 seconds timeout for large files
      }
    );
  },

};