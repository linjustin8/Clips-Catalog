//Signup.tsx

import React from "react";
import { useAuth } from "../../contexts/AuthContext";

interface SignupParams {
  username: string;
  email: string;
  password: string;
}

const Signup: React.FC = () => {
  const { signup } = useAuth();

  
  return (
  <>
    <h1>
        signup
    </h1>
  </>
  );
};

export default Signup;
