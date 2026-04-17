import { useState, useEffect } from 'react';
import { ingressosAPI } from './api';

function Admin() {
  const [ingressos, setIngressos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [senhaInput, setSenhaInput] = useState('');

  useEffect(() => {
    if (isAuthenticated) {
      carregarIngressos();
    }
  }, [isAuthenticated]);

  const carregarIngressos = async () => {
    setLoading(true);
    try {
      const data = await ingressosAPI.getIngressos();
      setIngressos(data);
    } catch(err) {
      console.error(err);
      alert('Erro ao carregar ingressos');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (senhaInput === '@ingresso2026') {
      setIsAuthenticated(true);
    } else {
      alert('Senha incorreta!');
    }
  };

  const handleDeletar = async (id) => {
    try {
      await ingressosAPI.deleteIngresso(id);
      alert('Ingresso Removido com sucesso!');
      carregarIngressos(); 
    } catch(err) {
      console.error(err);
      alert('Erro ao excluir ingresso, verifique a conexão com a API.');
    }
  };

  const handleConfirmar = async (id) => {
    try {
      await ingressosAPI.updateStatus(id, 'pago');
      alert('Ingresso confirmado e e-mail enviado com sucesso!');
      carregarIngressos();
    } catch(err) {
      console.error(err);
      alert('Erro ao confirmar ingresso.');
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'pago') return <span className="badge badge-success">Pago</span>;
    if (status === 'aguardando pagamento') return <span className="badge badge-warning">Pendente</span>;
    return <span className="badge">{status}</span>;
  };

  const formatarData = (dateStr) => {
    const d = new Date(dateStr);
    return d.toLocaleString('pt-BR');
  };

  const totais = {
    inscritos: ingressos.length,
    pagos: ingressos.filter(i => i.status_pagamento === 'pago').length,
    pendentes: ingressos.filter(i => i.status_pagamento !== 'pago').length,
  };

  if (!isAuthenticated) {
    return (
      <div className="glass-panel animate-fade-in" style={{ maxWidth: '400px', margin: '4rem auto', textAlign: 'center' }}>
        <h2>Acesso Administrativo</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Digite a senha para acessar o painel de vendas.</p>
        <form onSubmit={handleLogin}>
          <div className="form-group">
            <input 
              type="password" 
              className="form-control" 
              value={senhaInput} 
              onChange={(e) => setSenhaInput(e.target.value)} 
              placeholder="Senha de acesso" 
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Acessar</button>
        </form>
      </div>
    );
  }

  return (
    <div className="glass-panel animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Painel Admin - Vendas e Estatísticas</h2>
        <button className="btn" onClick={carregarIngressos} style={{ background: 'rgba(255,255,255,0.1)', color: 'white' }}>
          🔄 Atualizar
        </button>
      </div>

      {!loading && ingressos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid var(--primary)', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.5rem', color: 'var(--primary)', margin: 0 }}>{totais.inscritos}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>Inscrições Totais</p>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid var(--success)', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.5rem', color: 'var(--success)', margin: 0 }}>{totais.pagos}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>Confirmados (Pagos)</p>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid #f59e0b', padding: '1.5rem', borderRadius: '0.5rem', textAlign: 'center' }}>
            <h3 style={{ fontSize: '2.5rem', color: '#f59e0b', margin: 0 }}>{totais.pendentes}</h3>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontWeight: '600' }}>Parciais (Em Aprovação)</p>
          </div>
        </div>
      )}
      
      {loading ? (
        <p>Carregando...</p>
      ) : ingressos.length === 0 ? (
        <p style={{ color: 'var(--text-muted)' }}>Nenhum ingresso vendido ainda.</p>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Telefone</th>
                <th>Forma de Pag.</th>
                <th>Status</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {ingressos.map(ing => (
                <tr key={ing.id}>
                  <td>#GT-{ing.id.toString().padStart(5, '0')}</td>
                  <td>{ing.nome}</td>
                  <td>{ing.email}</td>
                  <td>{ing.telefone}</td>
                  <td style={{ textTransform: 'capitalize' }}>
                    {ing.forma_pagamento} {ing.parcelas ? `(${ing.parcelas}x)` : ''}
                  </td>
                  <td>{getStatusBadge(ing.status_pagamento)}</td>
                  <td>{formatarData(ing.data_compra)}</td>
                  <td style={{ display: 'flex', gap: '0.5rem' }}>
                    {ing.status_pagamento !== 'pago' && (
                      <button 
                        onClick={() => handleConfirmar(ing.id)}
                        className="btn" 
                        style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#10b981', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                        Confirmar
                      </button>
                    )}
                    <button 
                      onClick={() => handleDeletar(ing.id)}
                      className="btn" 
                      style={{ background: 'rgba(239, 68, 68, 0.2)', color: '#ef4444', padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                      Remover
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Admin;
