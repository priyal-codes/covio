import React from 'react'
import "../App.css"

export default function landing() {
    return (
        <div className='landingPageContainer'>
          <nav>
            <div className='navHeader'>
               <h2>Covio Video Call</h2>
            </div>
            <div className='navlist'>
                <p>Join as Guest</p>
                <p>Register</p>
                <div role='button'>
                    <p>Login</p>
                </div>
            </div>
          </nav>

          <div className="landingMainContainer">
            <div>
                <h1><span style={{color: "#FF9839"}}></span>Connect with your loved Ones</h1>
            </div>
          </div>
        </div>
    )
}