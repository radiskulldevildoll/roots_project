export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export const endpoints = {
  auth: {
    register: `${API_BASE_URL}/api/auth/users/`,
    login: `${API_BASE_URL}/api/auth/jwt/create/`,
    user: `${API_BASE_URL}/api/auth/users/me/`,
  },
  genealogy: {
    people: `${API_BASE_URL}/api/genealogy/people/`,
    relationships: `${API_BASE_URL}/api/genealogy/relationships/`,
    parentLinks: `${API_BASE_URL}/api/genealogy/parent_links/`,
    visualTree: `${API_BASE_URL}/api/genealogy/people/visual_tree/`,
    uploadPhoto: (id) => `${API_BASE_URL}/api/genealogy/people/${id}/`,
  },
  stories: {
    list: `${API_BASE_URL}/api/stories/`,
    detail: (id) => `${API_BASE_URL}/api/stories/${id}/`,
    byPerson: (id) => `${API_BASE_URL}/api/stories/by_person/?person_id=${id}`,
  },
  media: {
    list: `${API_BASE_URL}/api/media/`,
    detail: (id) => `${API_BASE_URL}/api/media/${id}/`,
    byPerson: (id) => `${API_BASE_URL}/api/media/by_person/?person_id=${id}`,
    byType: (type) => `${API_BASE_URL}/api/media/by_type/?type=${type}`,
  }
};
