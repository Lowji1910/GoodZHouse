const BASE_URL = process.env.REACT_APP_API_BASE_URL || '';

export async function apiGet(path, params) {
  let url;
  if (BASE_URL) {
    url = new URL(`${BASE_URL}${path}`);
  } else {
    url = new URL(path, window.location.origin);
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v);
    });
  }
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export const api = {
  listProducts: (params) => apiGet('/api/products', params),
  getProduct: (id) => apiGet(`/api/products/${id}`),
  listCategories: () => apiGet('/api/categories'),
  listPosts: () => apiGet('/api/posts'),
  listReviews: (params) => apiGet('/api/reviews', params),
  listCarts: (params) => apiGet('/api/carts', params),
  listOrders: (params) => apiGet('/api/orders', params),
  submitReview: (review) => fetch(`${BASE_URL}/api/reviews`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(review),
  }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); }),
  createOrder: ({ items, paymentMethod, shipping, couponCode }) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ items, paymentMethod, shipping, couponCode })
    }).then(async (r) => {
      if (r.ok) return r.json();
      // Try to parse JSON error body for a better message
      let errText = `HTTP ${r.status}`;
      try {
        const body = await r.json().catch(() => null);
        if (body) {
          if (body.message) errText = body.message;
          else if (body.error) errText = body.error;
          else errText = JSON.stringify(body);
        }
      } catch (e) {}
      throw new Error(errText);
    });
  },
  createPaymentIntent: ({ amount, paymentMethod, orderId }) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/payment/create-intent`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ amount, paymentMethod, orderId })
    }).then(async (r) => {
      if (r.ok) return r.json();
      let errText = `HTTP ${r.status}`;
      try {
        const body = await r.json().catch(() => null);
        if (body) errText = body.message || body.error || JSON.stringify(body);
      } catch (e) {}
      throw new Error(errText);
    });
  },
  getOrder: (id) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/orders/${id}`, {
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  validateCoupon: ({ code, subtotal }) =>
    apiGet('/api/coupons/validate', { code, subtotal }),
  listCoupons: () => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/coupons`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  createCoupon: (payload) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/coupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(payload)
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  updateCoupon: (id, updates) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/coupons/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(updates)
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  deleteCoupon: (id) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/coupons/${id}`, {
      method: 'DELETE',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return null; });
  },
  getCart: () => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/cart`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  putCart: (items) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/cart`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ items })
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  listNotifications: () => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/notifications`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  markNotificationRead: (id) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/notifications/${id}/read`, {
      method: 'PATCH',
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  // Chat APIs
  listConversations: () => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/chat/conversations`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  listMessages: (params) => {
    const token = localStorage.getItem('token');
    const url = new URL(`${BASE_URL}/api/chat/messages`);
    if (params) Object.entries(params).forEach(([k,v])=>{ if(v!==undefined&&v!==null&&v!=='') url.searchParams.set(k,v); });
    return fetch(url.toString(), {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  sendMessage: ({ toUserId = null, content }) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/chat/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify({ toUserId, content })
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  getInvoiceTemplate: () => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/invoices/template`, {
      headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}) }
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  updateInvoiceTemplate: (data) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/invoices/template`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(data)
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  },
  getSetting: (key) => apiGet(`/api/settings/${key}`),
  updateSetting: (key, data) => {
    const token = localStorage.getItem('token');
    return fetch(`${BASE_URL}/api/settings/${key}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...(token ? { 'Authorization': `Bearer ${token}` } : {}) },
      body: JSON.stringify(data)
    }).then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); });
  }
};
