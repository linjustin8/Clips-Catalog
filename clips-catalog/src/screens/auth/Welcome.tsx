// Welcome.tsx

import React from "react";
import { useNavigate } from "react-router-dom";
import "./Welcome.css";

const Welcome: React.FC = () => {
  const navigate = useNavigate();
  
  return (
    <div className="container">
      <div className="info">
        <h1 className="header">
          Share clips, highlights, and memories with friends.
        </h1>
        <p className="desc">
          Dive into a community where your best moments are celebrated by a
          vibrant network of users.
        </p>
        <button id="explore-button" onClick={() => {navigate("/videos")}}>EXPLORE</button>
      </div>
      <div className="bg-video">
        <video autoPlay muted loop>
          <source src="background_video.mp4" />
        </video>
      </div>
    </div>
  );
};

export default Welcome;
