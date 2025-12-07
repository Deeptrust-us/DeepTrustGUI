import api_instance from "../baseApi";

const endpoint = "video";

export const videoDetection = {

  // Post video to the backend
  postVideo: function () {
    return api_instance.post(
      `${endpoint}/add-comment/`,
      {  },
      {
        headers: { Authorization: `Bearer` },
      }
    );
  },

};