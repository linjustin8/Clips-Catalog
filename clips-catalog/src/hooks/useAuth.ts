// useAuth.ts
import React from "react";
import { AuthContext } from "../contexts/AuthContext";




export const useAuth = () => {
    const context = React.useContext(AuthContext);
    if (context === undefined) {
      throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
  };