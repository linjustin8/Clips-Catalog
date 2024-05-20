import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import  Welcome from './screens/auth/Welcome.tsx'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <>
      <Welcome />
    </>
    
  )
}

export default App
