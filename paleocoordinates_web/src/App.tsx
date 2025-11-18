import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/navbar';
import Footer from './components/Footer';
import Home from './pages/home';
import Rotate from './pages/Rotate';
import Citation from './pages/Citation';
import About from './pages/About';

function App() {
  return (
    <Router>
      <Navbar />
      <main style={{ paddingTop: '64px' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/rotate" element={<Rotate />} />
          <Route path="/citation" element={<Citation />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      <Footer />
    </Router>
  );
}

export default App;