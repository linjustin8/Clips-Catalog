// Upload.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const UploadModal = React.lazy(() => import("../../components/upload/UploadModal"));

const Upload: React.FC = () => {
  const navigate = useNavigate();

  return (
    <React.Suspense fallback={null}>
      <UploadModal open onClose={() => navigate("/videos")} />
    </React.Suspense>
  );
};

export default Upload;
