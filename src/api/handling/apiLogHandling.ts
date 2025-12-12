import api_instance from "../baseApi";

const endpoint = "logs";

export const logApi = {

    getAllLogs: function () {
        return api_instance.get(
            `${endpoint}/all`,
        );
    },

    getLogById: function (logId: number) {
        return api_instance.get(
            `${endpoint}/get_by_id`,
            {
                params: {
                    id: logId,
                }
            }
        );
    },

    deleteLogById: function (logId: number) {
        return api_instance.delete(
            `${endpoint}/delete_by_id`,
            {
                params: {
                    id: logId,
                }
            }
        );
    }
};
