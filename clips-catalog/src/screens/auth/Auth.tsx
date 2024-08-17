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

  const isValidEmail = validator.isEmail(email);
  const isValidPassword = password.length >= 6;
  
  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowSubmission) {
      return;
    }
    
    try {
      await login(email, password);
    } catch (err) {
      console.log(err);
    }
  };
  
  useEffect(() => {
    setAllowSubmission(isValidEmail && isValidPassword);
    console.log(allowSubmission);
  }, [email, password]);
  
  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="header">Log In</h1>
        <form
          className="form-container login"
          id="login"
          onSubmit={onSubmitHandler}
          noValidate
        >
          <InputField
            id="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            valid={isValidEmail}
            type="email"
          />
          <InputField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            valid={isValidPassword}
            type="password"
          />
        </form>
        <button form="login" className={`submit-user-info ${allowSubmission ? "allow-submit" : ""}`} disabled={!allowSubmission}>
          <p>LOGIN</p>
        </button>
      </div>
    </div>
  );
};

const Signup: React.FC = () => {
  const { signup } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowSubmission, setAllowSubmission] = useState(false);

  const isValidEmail = validator.isEmail(email);
  const isValidPassword = password.length >= 6;
  
  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowSubmission) {
      return;
    }
    
    try {
      await signup({username, email, password});
    } catch (err) {
      console.log(err);
    }
  };
  
  useEffect(() => {
    setAllowSubmission(isValidEmail && isValidPassword);
    console.log(allowSubmission);
  }, [email, password]);
  
  return (
    <div className="page-container">
      <div className="content-container">
        <h1 className="header">Sign Up</h1>
        <form
          className="form-container signup"
          id="signup"
          onSubmit={onSubmitHandler}
          noValidate
        >
          <InputField
            id="username"
            label="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            type="email"
          />
          <InputField
            id="email"
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            valid={isValidEmail}
            type="email"
          />
          <InputField
            id="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            valid={isValidPassword}
            type="password"
          />
        </form>
        <button form="signup" className={`submit-user-info ${allowSubmission ? "allow-submit" : ""}`} disabled={!allowSubmission}>
          <p>SIGN UP</p>
        </button>
      </div>
    </div>
  );
};

export { Login, Signup };
