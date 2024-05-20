//Welcome.tsx

import { useState } from 'react'
import './Welcome.css'

function Welcome() {
    
    return  (   
        <div className="container">
            <div className="info">
                ipsum Lorem, ipsum dolor sit amet consectetur adipisicing elit. Nobis illo sint suscipit ab quas ullam aliquid mollitia iusto, reprehenderit omnis sit consequatur architecto voluptas dolorem dignissimos, tempora natus deleniti vero?
            </div>
            <div className="bgVideo">
                <video autoPlay muted loop>
                    <source src="/background_video.mp4" />
                </video>
            </div>
        </div>
    )   
}

export default Welcome
 