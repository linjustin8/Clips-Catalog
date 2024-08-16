//Auth.tsx

import React, { useState, useEffect } from "react";
import validator from "validator";
import { useAuth } from "../../contexts/AuthContext";
import { InputField } from "../../components/InputField";
import "./Auth.css";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowSubmission, setAllowSubmission] = useState(false);

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if(!allowSubmission) {
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      console.log(err);
    }
  };
  
  useEffect(() => {
    if(!validator.isEmail(email)) {
      setAllowSubmission(false);
    }
  },[email, password])
  
  
  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="header">Log In</h1>
        <form
          className="form-container"
          id="login"
          onSubmit={onSubmitHandler}
          noValidate
        >
          <InputField
            id="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
          />
          <InputField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
          />
        </form>
        <button form="login" className="submit-user-info" disabled={true}>
          <p>LOGIN</p>
        </button>
      </div>
    </div>
  );
};

const Signup: React.FC = () => {
  const { signup } = useAuth();

  return (
    <>
      <h1>signup</h1>
    </>
  );
};

export { Login, Signup };
