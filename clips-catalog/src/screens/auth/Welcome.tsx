//Welcome.tsx

import { useState } from 'react'
import './Welcome.css'

function Welcome() {
    
    return  (
        <>
            <div className="bgVideo">
                <video autoPlay muted loop>
                    <source src="/background_video.mp4" />
                </video>
                Balls
                
            </div>
            <div className="fade"></div>
        </>
    )   
}

export default Welcome
