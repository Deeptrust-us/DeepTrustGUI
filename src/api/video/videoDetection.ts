import api_instance from "../baseApi";

const endpoint = "analyze_video";

export const videoDetection = {
  // Post video blob to the backend
  postVideo: function (videoBlob: Blob, filename = "recording.webm") {
    const formData = new FormData();
    formData.append("file", videoBlob, filename);

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