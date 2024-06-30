// AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode, useContext } from 'react'
import axios from 'axios'


interface User {
    username: string
    email: string
    uuid: string
    password: string
    roles: Array<string>
}

interface SignupParams {
    username: string;
    email: string;
    password: string;
    roles: Array<string>;
}

interface AuthContextType {
    user: User | null;
    signup: (params: SignupParams) => Promise<void>;
    login: (username: string, password: string) => Promise<void>;
    logout: () => void;
}


