//Auth.tsx

import React, { useState, useEffect } from "react";
import axios from "axios";
import validator from "validator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import useAuth from "../../hooks/useAuth";
import { InputField } from "../../components/InputField";
import "./Auth.css";

const Login: React.FC = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [allowSubmission, setAllowSubmission] = useState(false);
  const [error, setError] = useState("");

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
      if (axios.isAxiosError(err)) {
        const errorMessage = err.response?.data.message;
        setError("Error: " + String(errorMessage));
        console.log(errorMessage);
      }
      setPassword("");
    }
  };

  useEffect(() => {
    setAllowSubmission(isValidEmail && isValidPassword);
  }, [email, password]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setError("");
    }, 3000)
    
    return () => clearTimeout(timer);
  }, [error]);
  
  return (
    <div className="page-container">
      {error && (
        <div className="error-popup">
          <h1>{error}</h1>
          <button onClick={() => setError("")}>
            <FontAwesomeIcon className="icon" icon={faXmark} />
          </button>
        </div>
      )}
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
        <button
          form="login"
          className={`submit-user-info ${
            allowSubmission ? "allow-submit" : ""
          }`}
          disabled={!allowSubmission}
        >
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
  const [error, setError] = useState("");
  
  const isValidUsername = username.length > 3;
  const isValidEmail = validator.isEmail(email);
  const isValidPassword = password.length >= 6;

  const onSubmitHandler = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!allowSubmission) {
      return;
    }

    try {
      await signup({ username, email, password });
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errors = err.response?.data.errors;
        
        setError("Error(s): " + errors + " already in use");
        console.log(errors);
      }
      setPassword("");
    }
  };

  useEffect(() => {
    setAllowSubmission(isValidEmail && isValidPassword);
  }, [email, password]);

  return (
    <div className="page-container">
      {error && (
        <div className="error-popup">
          <h1>{error}</h1>
          <button onClick={() => setError("")}>
            <FontAwesomeIcon className="icon" icon={faXmark} />
          </button>
        </div>
      )}
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
            valid={isValidUsername}
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
        <button
          form="signup"
          className={`submit-user-info ${
            allowSubmission ? "allow-submit" : ""
          }`}
          disabled={!allowSubmission}
        >
          <p>SIGN UP</p>
        </button>
      </div>
    </div>
  );
};

export { Login, Signup };
