const API_URL = 'http://localhost:3001/api';

export const ingressosAPI = {
  createCompra: async (dados) => {
    const res = await fetch(`${API_URL}/ingressos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    if (!res.ok) throw new Error('Erro ao criar compra');
    return res.json();
  },
  
  createPagBankCompra: async (dados) => {
    const res = await fetch(`${API_URL}/pagamento-pagbank`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dados)
    });
    const parsed = await res.json();
    if (!res.ok) throw new Error(parsed.error || 'Erro processando Cartão no Gateway');
    return parsed;
  },
  
  getIngressos: async () => {
    const res = await fetch(`${API_URL}/ingressos`);
    if (!res.ok) throw new Error('Erro ao buscar ingressos');
    return res.json();
  },

  updateStatus: async (id, status) => {
    const res = await fetch(`${API_URL}/ingressos/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    });
    if (!res.ok) throw new Error('Erro ao atualizar status');
    return res.json();
  },

  deleteIngresso: async (id) => {
    const res = await fetch(`${API_URL}/ingressos/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) throw new Error('Erro ao deletar ingresso');
    return res.json();
  }
};
