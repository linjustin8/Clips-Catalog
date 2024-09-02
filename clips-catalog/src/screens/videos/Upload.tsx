// Upload.tsx
import React from "react";
import useAuth from "../../hooks/useAuth";

const Upload: React.FC = () => {
  const { user } = useAuth();
  
  if (user?.roles[1] !== "Uploader" ) {
    return (
        <div>
            
        </div>
    )
  }
  
  return (
    <>
      <h1>Upload</h1>
    </>
  );
};

export default Upload;
