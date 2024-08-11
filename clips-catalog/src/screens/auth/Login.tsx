//Login.tsx

import React from "react";
import { login } from "../../contexts/AuthContext"
import "./Auth.css"

interface LoginParams {
  
}


const Login: React.FC = (() => {
    
    return ( 
      <div className="form-container">
        <form>
          <h1 className="header">LOG IN</h1>
          <input className="email" placeholder="Email Address" />
          <input className="password" placeholder="Password" />
        </form>
      </div>
    );
 });


export default Login;