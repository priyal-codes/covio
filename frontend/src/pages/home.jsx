import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/home.module.css';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import CloseIcon from '@mui/icons-material/Close';
import VideoCamIcon from '@mui/icons-material/Videocam';

const server_url = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

export default function HomeComponent() {
    const navigate = useNavigate();
    const [token] = useState(localStorage.getItem("token"));
    const [username, setUsername] = useState("");
    const [meetingCode, setMeetingCode] = useState("");
    const [historyOpen, setHistoryOpen] = useState(false);
    const [historyList, setHistoryList] = useState([]);
    const [loadingHistory, setLoadingHistory] = useState(false);

    const handleLogout = useCallback(() => {
        localStorage.removeItem("token");
        navigate('/auth');
    }, [navigate]);

    useEffect(() => {
        if (!token) {
            navigate('/auth');
            return;
        }

        // Fetch User Info
        axios.get(`${server_url}/api/v1/users/get_user_info`, {
            params: { token }
        })
        .then(res => {
            setUsername(res.data.username);
        })
        .catch(err => {
            console.error("Failed to fetch user info", err);
            // If token is invalid/expired, log out
            handleLogout();
        });
    }, [token, navigate, handleLogout]);

    const fetchHistory = async () => {
        setLoadingHistory(true);
        try {
            const res = await axios.get(`${server_url}/api/v1/users/get_all_activity`, {
                params: { token }
            });
            setHistoryList(res.data);
        } catch (err) {
            console.error("Failed to fetch history", err);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleOpenHistory = () => {
        setHistoryOpen(true);
        fetchHistory();
    };

    const handleJoinMeeting = async (codeToJoin) => {
        const code = codeToJoin || meetingCode;
        if (!code.trim()) return;

        try {
            // Save meeting to activity/history in backend
            await axios.post(`${server_url}/api/v1/users/add_to_activity`, {
                token,
                meeting_code: code
            });
        } catch (err) {
            console.error("Failed to save to activity history", err);
        }

        // Navigate to the video call room
        navigate(`/${code}`);
    };

    const handleCreateInstantMeeting = () => {
        // Generate a random meeting code in the format: meet-xxx-xxx
        const chars = 'abcdefghijklmnopqrstuvwxyz';
        const part1 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part2 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const part3 = Array.from({ length: 3 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
        const generatedCode = `meet-${part1}-${part2}-${part3}`;
        setMeetingCode(generatedCode);
    };

    return (
        <div className={styles.homeContainer}>
            {/* Header / Navbar */}
            <nav className={styles.navbar}>
                <div className={styles.logo} onClick={() => navigate('/')}>
                    Covio Video Call
                </div>
                <div className={styles.navActions}>
                    <button className={styles.navButton} onClick={handleOpenHistory}>
                        <HistoryIcon fontSize="small" />
                        History
                    </button>
                    <button className={styles.logoutButton} onClick={handleLogout}>
                        <LogoutIcon fontSize="small" />
                        LOGOUT
                    </button>
                </div>
            </nav>

            {/* Main Area */}
            <main className={styles.mainContent}>
                <div className={styles.leftSection}>
                    {username && <div className={styles.userInfo}>{username}</div>}
                    <h1 className={styles.headline}>
                        Providing Quality Video Call Just Like Quality Education
                    </h1>

                    <div className={styles.joinContainer}>
                        <div className={styles.inputGroup}>
                            <input
                                className={styles.meetInput}
                                placeholder="Meeting Code"
                                value={meetingCode}
                                onChange={(e) => setMeetingCode(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        handleJoinMeeting();
                                    }
                                }}
                            />
                            <button className={styles.joinBtn} onClick={() => handleJoinMeeting()}>
                                <VideoCamIcon />
                                JOIN
                            </button>
                        </div>
                        <div className={styles.createInstantRow}>
                            <span>Or start a new session?</span>
                            <button className={styles.createLink} onClick={handleCreateInstantMeeting}>
                                Create instant meeting code
                            </button>
                        </div>
                    </div>
                </div>

                <div className={styles.rightSection}>
                    <img className={styles.illustration} src="/mobile.png" alt="Video Call Illustration" />
                </div>
            </main>

            {/* Sliding History Drawer */}
            <div 
                className={`${styles.drawerOverlay} ${historyOpen ? styles.drawerOverlayActive : ''}`}
                onClick={() => setHistoryOpen(false)}
            />
            <div className={`${styles.drawer} ${historyOpen ? styles.drawerOpen : ''}`}>
                <div className={styles.drawerHeader}>
                    <h2 className={styles.drawerTitle}>
                        <HistoryIcon />
                        Meeting History
                    </h2>
                    <button className={styles.closeBtn} onClick={() => setHistoryOpen(false)}>
                        <CloseIcon />
                    </button>
                </div>

                <div className={styles.historyList}>
                    {loadingHistory ? (
                        <div className={styles.emptyState}>Loading history...</div>
                    ) : historyList.length === 0 ? (
                        <div className={styles.emptyState}>
                            No past meetings found.
                        </div>
                    ) : (
                        historyList.map((item) => (
                            <div key={item._id} className={styles.historyItem}>
                                <div className={styles.historyDetails}>
                                    <div className={styles.historyCode}>{item.meetingCode}</div>
                                    <div className={styles.historyDate}>
                                        {new Date(item.date).toLocaleString()}
                                    </div>
                                </div>
                                <button 
                                    className={styles.joinHistoryBtn} 
                                    onClick={() => handleJoinMeeting(item.meetingCode)}
                                >
                                    Join
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
