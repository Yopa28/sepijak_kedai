import api, { handleApiResponse, handleApiError } from './api';

export const submitFeedback = async (payload) => {
  try {
    // Map frontend structure to new backend format (individual rating fields)
    const body = {
      // Core fields
      role: payload.role,
      employee_name: payload.employee_name,
      contact: payload.contact,
      date_of_visit: payload.date_of_visit,
      time_of_visit: payload.time_of_visit,

      // Individual rating fields (for each criteria)
      rating_sikap_pelayan: payload.ratings.pelayanan.sikap_pelayan,
      rating_waktu_pesanan: payload.ratings.pelayanan.waktu_pesanan,
      rating_rasa_menu: payload.ratings.menu.rasa_menu,
      rating_kebersihan: payload.ratings.kebersihan,

      // Other fields
      message: payload.message,
      voluntary_consent: payload.voluntary_consent,
      category: payload.category || null,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
    };

    const res = await api.post('/feedback', body);
    return handleApiResponse(res);
  } catch (err) {
    return handleApiError(err);
  }
};

// supaya AdminFeedback.vue ga error import
export const getFeedback = async (params = {}) => {
  try {
    const res = await api.get('/feedback', { params });
    return handleApiResponse(res);
  } catch (err) {
    return handleApiError(err);
  }
};

export default { submitFeedback, getFeedback };