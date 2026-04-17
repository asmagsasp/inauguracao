import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './Home';
import Admin from './Admin';
import './index.css';

function App() {
  return (
    <Router>
      <div className="app-container">
        <nav className="navbar">
          <div>
            <h2 className="gradient-text" style={{margin: 0}}>Girafa Tech</h2>
          </div>
          <div style={{display: 'flex', gap: '1.5rem'}}>
            <Link to="/" className="nav-link">Comprar Ingresso</Link>
            <Link to="/admin" className="nav-link">Painel Admin</Link>
          </div>
        </nav>
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
