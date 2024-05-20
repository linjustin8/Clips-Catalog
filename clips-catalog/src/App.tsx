// App.tsx
import  Welcome from './screens/auth/Welcome.tsx'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import './App.css'

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/*" element={<Welcome />} />
      </Routes>
    </>
    
  )
}

export default App
