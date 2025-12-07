import api_instance from "../baseApi";

const endpoint = "audio";

export const audioDetection = {

  // Post video to the backend
  postAudio: function () {
    return api_instance.post(
      `${endpoint}/add-comment/`,
      {  },
      {
        headers: { Authorization: `Bearer` },
      }
    );
  },

};