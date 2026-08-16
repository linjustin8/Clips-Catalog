// Upload.tsx
import React from "react";
import usePermissions from "../../hooks/usePermissions";

const Upload: React.FC = () => {
  const { isAdmin } = usePermissions();

  if (!isAdmin) {
    return <div>You do not have permission to upload videos.</div>;
  }

  return (
    <>
      <h1>Upload</h1>
    </>
  );
};

export default Upload;
