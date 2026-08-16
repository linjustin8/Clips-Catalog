import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { AuthProvider } from "./contexts/AuthContext.tsx";
import {BrowserRouter as Router} from 'react-router-dom'
import { ThemeProvider } from "@mui/material/styles";
import theme from "./theme.ts";


const root = ReactDOM.createRoot(document.getElementById('root')!)
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <App />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>,
)
