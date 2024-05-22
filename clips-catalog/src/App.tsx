// App.tsx
import  Welcome from './screens/auth/Welcome.tsx'
import Videos from './screens/videos/Videos.tsx'
import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar.tsx'
import './App.css'

const App: React.FC = () => {
  
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/videos" element={<Videos />} />
        <Route path="/*" element={<Welcome />} />
      </Routes>
    </>
  )
}

export default App
