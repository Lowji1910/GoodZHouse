import React from 'react';
import './App.css';
import AppRouter from './router';
import Navbar from './components/Header/Navbar';
import Footer from './components/Footer/Footer';
import { BrowserRouter } from 'react-router-dom';
import MiniCart from './components/Cart/MiniCart';
import ChatModal from './components/Chat/ChatModal';
import { ToastProvider } from './context/ToastContext';

function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Navbar />
        <MiniCart />
        <ChatModal />
        <div className="App">
          <AppRouter />
        </div>
        <Footer />
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
