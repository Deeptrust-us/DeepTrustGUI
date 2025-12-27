import api_instance from "../baseApi";

const endpoint = "analyze_audio";

export interface ScanResult {
  status: "authentic" | "fake";
  score: number;
  manipulation: string;
  probability: string;
  resultId: string;
}

export const audioDetection = {
  // Post audio blob to the backend
  postAudio: function (audioBlob: Blob, filename = "recording.webm") {
    const formData = new FormData();
    formData.append("file", audioBlob, filename); // Changed from "audio" to "file"

    return api_instance.post<any>(
      `${endpoint}`,
    formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 60000,
      }
    );
  },
};