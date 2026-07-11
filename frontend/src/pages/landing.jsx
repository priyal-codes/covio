import React, { useEffect, useState } from 'react'
import "../App.css"
import { Link, useNavigate } from 'react-router-dom'


export default function Landing() {
    const navigate = useNavigate();
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    useEffect(() => {
        if (localStorage.getItem("token")) {
            setIsLoggedIn(true);
        }
    }, []);

    const handleJoinAsGuest = () => {
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const generatedCode = `${part1}-${part2}-${part3}`;
        navigate(`/${generatedCode}`);
    };

    return (
        <div className='landingPageContainer'>
          <nav>
            <div className='navHeader' style={{ cursor: 'pointer' }} onClick={() => navigate('/')}>
               <h2>Covio Video Call</h2>
            </div>
            <div className='navlist'>
                <p onClick={handleJoinAsGuest}>Join as Guest</p>
                <p onClick={() => navigate('/auth', { state: { formState: 1 } })}>Register</p>
                <div role='button' onClick={() => navigate(isLoggedIn ? '/home' : '/auth', { state: { formState: 0 } })}>
                    <p>{isLoggedIn ? 'Dashboard' : 'Login'}</p>
                </div>
            </div>
          </nav>

          <div className="landingMainContainer">
            <div>
                <h1><span>Connect</span> with your loved Ones</h1>

                <p>Cover a distance by Covio Video call</p>
                <div role='button'>
                  <Link to={isLoggedIn ? "/home" : "/auth"}>
                    {isLoggedIn ? "Go to Home" : "Get Started"}
                  </Link>
                </div>

            </div>
            <div>
              <img src="/mobile.png" alt="" />
            </div>
          </div>
        </div>
    )
}