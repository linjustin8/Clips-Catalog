// Welcome.tsx

import React from 'react'
import './Welcome.css'

const Welcome: React.FC = () => {
    
    return  (   
        <div className="container">
            <p className="info">
            Share clips, highlights, and content with friends to amplify your best experiences. 
            </p>
            <div className="bgVideo">
                <video autoPlay muted loop>
                    <source src="/background_video.mp4" />
                </video>
            </div>
        </div>
    )   
}

export default Welcome
 