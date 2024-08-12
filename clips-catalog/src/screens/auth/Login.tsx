//Login.tsx

import React from "react";
import { login } from "../../contexts/AuthContext";
import { InputField } from "../../components/InputField";
import "./Auth.css";

interface LoginParams {}

const Login: React.FC = () => {
  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="header">Log In</h1>
        <form className="form-container" id="login">
          <InputField id="email" label="Email Address" className="user-entry" />
          <InputField id="password" label="Password" className="user-entry" />
        </form>
        <button>LOG IN</button>
      </div>
    </div>
  );
};

export default Login;
