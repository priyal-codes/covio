import React, { useEffect, useRef, useState } from 'react'
import io from "socket.io-client";
import { IconButton, TextField } from '@mui/material';
import { Button } from '@mui/material';
import { Input } from '@mui/base';
import VideoCamIcon from '@mui/icons-material/VideoCam';
import VideoCamOffIcon from '@mui/icons-material/VideoCamOff'
import styles from "../styles/videoComponent.module.css";
import CallEndIcon from '@mui/icons-material/CallEnd'
import MicIcon from '@mui/icons-material/Mic'
import MicOffIcon from '@mui/icons-material/MicOff'
import ChatIcon from '@mui/icons-material/Chat';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';

const server_url = "http://localhost:8000";

var connections = {};

const peerConfigConnections = {
    "iceServers": [
        { "urls": "stun:stun.l.google.com:19302"}
    ]
}

export default function VideoMeetComponent() {

    var socketRef = useRef();
    let socketIdRef = useRef();

    let localVideoRef = useRef();

    const setLocalVideoRef = (element) => {
        if (element) {
            localVideoRef.current = element;
            if (screen && window.screenStream) {
                element.srcObject = window.screenStream;
            } else if (window.localStream) {
                element.srcObject = window.localStream;
            }
        }
    };

    let [videoAvailable, setVideoAvailable] = useState(true);
    let [audioAvailable, setAudioAvailable] = useState(true);

    let [video, setVideo] = useState(true);
    let [audio, setAudio] = useState(true);
    let [screen, setScreen] = useState(false);
    let [showModal, setModal] = useState(false);
    let [screenAvailable, setScreenAvailable] = useState(true);

    let [message, setMessage] = useState("");
    let [messages, setMessages] = useState([]);
    let [newMessages, setNewMessages] = useState(0);

    let [username, setUsername] = useState("");
    let [chatTab, setChatTab] = useState("chat"); // "chat" or "ai"
    let [aiMessage, setAiMessage] = useState("");
    let [aiMessages, setAiMessages] = useState([
        { sender: "AI Assistant", data: "Hello! I am your AI meeting helper. Ask me for 'help', 'agenda', 'notes', 'code', or 'summary'!", socketIdSender: "ai" }
    ]);
    let [isAiTyping, setIsAiTyping] = useState(false);

    let handleSendAiMessage = () => {
        if (aiMessage.trim() === "") return;
        
        const userMsg = aiMessage;
        setAiMessages((prev) => [...prev, { sender: username || "You", data: userMsg, socketIdSender: socketIdRef.current }]);
        setAiMessage("");
        setIsAiTyping(true);

        setTimeout(() => {
            let response = "I'm processing that. As a meeting assistant, I can help you draft notes, write code snippets, or summarize topics! Try asking for 'agenda', 'notes', 'code', or 'summary'.";
            const lowerMsg = userMsg.toLowerCase();

            if (lowerMsg.includes("hello") || lowerMsg.includes("hi")) {
                response = `Hi there, ${username || "friend"}! How can I assist you in this meeting?`;
            } else if (lowerMsg.includes("help")) {
                response = "Here are things you can ask me:\n• 'agenda' - Draft a meeting agenda\n• 'notes' - Create template meeting notes\n• 'code' - Show a clean React component example\n• 'summary' - Generate a mock summary of our discussion";
            } else if (lowerMsg.includes("agenda")) {
                response = "Here's a standard agenda template you can use:\n1. Status Updates (10m)\n2. Technical Deep-Dive & Architecture (25m)\n3. UX/UI Improvements (15m)\n4. Next Steps & Action Items (10m)";
            } else if (lowerMsg.includes("notes") || lowerMsg.includes("meeting notes")) {
                response = "Meeting Notes Template:\n- Date: " + new Date().toLocaleDateString() + "\n- Attending: " + (username || "User") + " & team\n\nDiscussion Points:\n- [Enter points]\n\nAction Items:\n- [ ] Task A (Assignee)\n- [ ] Task B (Assignee)";
            } else if (lowerMsg.includes("code") || lowerMsg.includes("example")) {
                response = "Here is a modern React functional component snippet:\n\n```jsx\nimport React from 'react';\n\nexport default function Widget() {\n  return (\n    <div className='card'>\n      <h3>AI Enhanced Widget</h3>\n    </div>\n  );\n}\n```";
            } else if (lowerMsg.includes("summary")) {
                response = "Based on our current call structure, here is the discussion summary:\n• Participant: " + (username || "Anonymous") + " joined the meeting.\n• Status: Audio and Video streaming are fully operational.\n• Key focus: Enhancing UI/UX and integrating advanced chat capabilities.";
            }

            setAiMessages((prev) => [...prev, { sender: "AI Assistant", data: response, socketIdSender: "ai" }]);
            setIsAiTyping(false);
        }, 1000);
    };

    const videoRef = useRef([])
    let [videos, setVideos] = useState([])
    let [askForUsername, setAskForUsername] = useState(true); 

    const getPermissions = async () => {
        try {
            const videoPermission = await navigator.mediaDevices.getUserMedia({video: true})
            if(videoPermission) {
                setVideoAvailable(true);
            } else {
                setVideoAvailable(false);
            } 

            const AudioPermission = await navigator.mediaDevices.getUserMedia({audio: true})
            if(AudioPermission) {
                setAudioAvailable(true);
            } else {
                setAudioAvailable(false);
            } 

            if(videoAvailable || audioAvailable) {
                const userMediaStream = await navigator.mediaDevices.getUserMedia({video: videoAvailable, audio: audioAvailable});
                if(userMediaStream) {
                    window.localStream = userMediaStream;
                    if(localVideoRef.current) {
                        localVideoRef.current.srcObject = userMediaStream;
                    } 
                }
            }
        } catch (err){
            console.log(err);
        }
    }

    useEffect(() => {
        getPermissions();
    }, []) 

    let getUserMediaSuccess = (stream) => {
        try {
            window.localStream.getTracks().forEach(track => track.stop()) 
        } catch (e) {
            console.log(e);
        }

        window.localStream = stream;
        localVideoRef.current.srcObject = stream;
        for (let id in connections) {
            if(id === socketIdRef.current) continue;
            connections[id].addStream(window.localStream)
            connections[id].createOffer().then((description)=> {
                connections[id].setLocalDescription(description)
                .then(()=> {
                    socketRef.current.emit("signal", id, JSON.stringify({ "sdp": connections[id].localDescription}))
                })
                .catch(e => console.log(e))
            }) 
        }

        stream.getTracks().forEach(track => track.onended = () => {
            setVideo(false)
            setAudio(false);

            try{
                let tracks = localVideoRef.current.srcObject.getTracks()
                tracks.forEach(track => track.stop())
            } catch(e) {console.log(e)}

            let blackSilence = ( ...args) => new MediaStream([black( ...args), silence()]);
            window.localStream = blackSilence();
            localVideoRef.current.srcObject = window.localStream;
                       
            for ( let id in connections) {
                connections[id].addStream(window.localStream)
                connections[id].createOffer().then((description)=>{
                    connections[id].setLocalDescription(description)
                    .then(()=>{
                        socketRef.current.emit("signal", id, JSON.stringify({"sdp":connections[id].localDescription}))
                    }).catch(e => console.log(e));
                })
            }
        })
    }

    let silence = () => {
        let ctx = new AudioContext()
        let oscillator = ctx.createOscillator();
        let dst = oscillator.connect(ctx.createMediaStreamDestination());
        oscillator.start();
        ctx.resume()
        return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false })
    }

    let black = ({width = 640, height = 480} = {}) => {
        let canvas = Object.assign(document.createElement("canvas"), {width, height});
        canvas.getContext('2d').fillRect(0, 0, width, height);
        let stream = canvas.captureStream();
        return Object.assign(stream.getVideoTracks()[0], { enabled: false })
    }

    let getUserMedia = () => {
        if((video && videoAvailable) || (audio && audioAvailable)) {
            navigator.mediaDevices.getUserMedia({video: video, audio: audio})
            .then(getUserMediaSuccess)
            .catch((e) => console.log(e))
        } else {
            try {
                let tracks = localVideoRef.current.srcObject.getTracks();
                tracks.forEach(track => track.stop())
            } catch(e) {}
        }
    }

    useEffect(() => {
        if(video === undefined && audio === undefined) {
            getUserMedia();
        }
    }, [audio, video])

    let gotMessageFromServer = (fromId, message) => {
         var signal = JSON.parse(message)

         if(fromId !== socketIdRef.current) {
            if(signal.sdp) {
                connections[fromId].setRemoteDescription(new RTCSessionDescription(signal.sdp)).then(() => {
                    if(signal.sdp.type === "offer" ) {
                        connections[fromId].createAnswer().then((description)=> {
                           connections[fromId].setLocalDescription(description).then(()=>{
                            socketRef.current.emit("signal", fromId, JSON.stringify({"sdp": connections[fromId].localDescription}))
                           }).catch(e => console.log(e)) 
                        }).catch(e=>console.log(e))
                    }

                    if (connections[fromId].iceCandidatesQueue) {
                        connections[fromId].iceCandidatesQueue.forEach(candidate => {
                            connections[fromId].addIceCandidate(new RTCIceCandidate(candidate)).catch(e => console.log(e));
                        });
                        connections[fromId].iceCandidatesQueue = [];
                    }
                }).catch(e=>console.log(e))
            }
            if(signal.ice) {
                if (connections[fromId].remoteDescription) {
                    connections[fromId].addIceCandidate(new RTCIceCandidate(signal.ice)).catch(e=>console.log(e));
                } else {
                    if (!connections[fromId].iceCandidatesQueue) {
                        connections[fromId].iceCandidatesQueue = [];
                    }
                    connections[fromId].iceCandidatesQueue.push(signal.ice);
                }
            }
         }
    }

    let addMessage = (data, sender, socketIdSender) => {
        console.log("addMessage triggered:", data, sender, socketIdSender);
        setMessages((prevMessages) => [
            ...prevMessages,
            { sender: sender, data: data, socketIdSender: socketIdSender }
        ]);

        if (socketIdSender !== socketIdRef.current) {
            setNewMessages((prevNewMessages) => prevNewMessages + 1);
        }
    }
 
    let connectToSocketServer = () => {
        connections = {};

        socketRef.current = io.connect(server_url, { secure: false })
        socketRef.current.on('signal', gotMessageFromServer);

        socketRef.current.on("connect", () => {
            socketRef.current.emit("join-call", window.location.href)
            socketIdRef.current = socketRef.current.id
        })

        socketRef.current.on("chat-message", addMessage)

        socketRef.current.on("user-left", (id)=> {
            setVideos((videos)=> videos.filter((video)=>video.socketId !== id))
            if (connections[id]) {
                connections[id].close();
                delete connections[id];
            }
        })

        socketRef.current.on("user-joined", (id, clients) => {
            clients.forEach((socketListId)=>{
                if (socketListId === socketIdRef.current) return;

                if (connections[socketListId] === undefined) {
                    connections[socketListId] = new RTCPeerConnection(peerConfigConnections)

                    connections[socketListId].onicecandidate = (event) => {
                        if (event.candidate != null) {
                            socketRef.current.emit("signal", socketListId, JSON.stringify({ 'ice': event.candidate}))
                        }
                    }

                    connections[socketListId].onaddstream = (event) => {
                        let videoExists = videoRef.current.find(video => video.socketId === socketListId);

                        if (videoExists) {
                            setVideos(videos => {
                                const updatedVideos = videos.map(video => 
                                    video.socketId === socketListId ? { ...video, stream: event.stream } : video
                                );
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            })
                        } else {
                            let newVideo = {
                                socketId: socketListId,
                                stream: event.stream,
                                autoPlay: true,
                                playsinline: true
                            }

                            setVideos(videos => {
                                const updatedVideos = [ ...videos, newVideo]
                                videoRef.current = updatedVideos;
                                return updatedVideos;
                            });
                        }
                    };

                    if (window.localStream !== undefined) {
                        connections[socketListId].addStream(window.localStream);  
                    } else {
                        let blackSilence = ( ...args) => new MediaStream([black( ...args), silence()]);
                        window.localStream = blackSilence();
                        connections[socketListId].addStream(window.localStream);
                    }
                }
            })

            if (id === socketIdRef.current) {
                for (let id2 in connections) {
                    if (id2 === socketIdRef.current) continue

                    try {
                        connections[id2].addStream(window.localStream)
                    } catch (e) {}

                    connections[id2].createOffer().then((description)=>{
                        connections[id2].setLocalDescription(description)
                       .then(()=>{
                            socketRef.current.emit("signal", id2, JSON.stringify({"sdp": connections[id2].localDescription}))
                        })
                        .catch(e => console.log(e))
                    })
                }
            }
        })
    }

    let getMedia = () => {
        setVideo(videoAvailable);
        setAudio(audioAvailable);
        connectToSocketServer();
    }

    let connect = () => {
        setAskForUsername(false);
        getMedia();
    }

    let handleVideo = () => {
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setVideo(videoTrack.enabled);
            }
        }
    }

    let handleAudio = () => {
        if (window.localStream) {
            const audioTrack = window.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setAudio(audioTrack.enabled);
            }
        }
    }

    let stopScreenShare = () => {
        setScreen(false);
        if (window.screenStream) {
            window.screenStream.getTracks().forEach(track => track.stop());
        }

        if (window.localStream) {
            const camVideoTrack = window.localStream.getVideoTracks()[0];
            for (let id in connections) {
                let senders = connections[id].getSenders();
                let videoSender = senders.find(sender => sender.track && sender.track.kind === "video");
                if (videoSender) {
                    videoSender.replaceTrack(camVideoTrack);
                }
            }
            if (localVideoRef.current) {
                localVideoRef.current.srcObject = window.localStream;
            }
        }
    }

    let handleScreen = () => {
        if (!screen) {
            if (navigator.mediaDevices.getDisplayMedia) {
                navigator.mediaDevices.getDisplayMedia({ video: true })
                .then((screenStream) => {
                    const screenTrack = screenStream.getVideoTracks()[0];
                    for (let id in connections) {
                        let senders = connections[id].getSenders();
                        let videoSender = senders.find(sender => sender.track && sender.track.kind === "video");
                        if (videoSender) {
                            videoSender.replaceTrack(screenTrack);
                        }
                    }
                    window.screenStream = screenStream;
                    localVideoRef.current.srcObject = screenStream;
                    setScreen(true);

                    screenTrack.onended = () => {
                        stopScreenShare();
                    }
                })
                .catch(e => console.log(e))
            }
        } else {
            stopScreenShare();
        }
    }

    let handleEndCall = () => {
        try {
            let tracks = localVideoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        } catch (e) {}
        if (socketRef.current) {
            socketRef.current.disconnect();
        }
        window.location.href = "/";
    }

    let sendMessage = () => {
        if (message.trim() !== "") {
            console.log("sendMessage triggering:", message, username);
            socketRef.current.emit("chat-message", message, username);
            setMessage("");
        }
    }

    return (
        <div>
            {askForUsername === true ?
            <div className={styles.lobbyContainer}>
                <div className={styles.lobbyCard}>
                    <h2>Enter into Lobby</h2>
                    <video className={styles.lobbyVideo} ref={setLocalVideoRef} autoPlay muted></video>
                    <TextField 
                        id="outlined-basic" 
                        label="Username" 
                        value={username} 
                        onChange={e => setUsername(e.target.value)} 
                        variant="outlined"
                        fullWidth
                        InputProps={{
                            style: {
                                color: 'white',
                                background: 'rgba(255,255,255,0.05)',
                                borderRadius: '12px'
                            }
                        }}
                        InputLabelProps={{
                            style: { color: '#9ca3af' }
                        }}
                    />
                    <Button 
                        variant="contained" 
                        onClick={connect} 
                        fullWidth
                        style={{
                            background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)',
                            borderRadius: '12px',
                            padding: '12px',
                            fontWeight: '600',
                            textTransform: 'none',
                            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.4)'
                        }}
                    >
                        Join Meeting
                    </Button>
                </div>
             </div> : <div className={styles.meetContainer}>
            
                 <div className={`${styles.localVideoContainer} ${videos.length === 0 ? styles.alone : ''} ${showModal ? styles.shiftLeft : ''}`}>
                     <video
                          className={styles.localVideo}
                          ref={setLocalVideoRef}
                          autoPlay
                          muted
                     />
                 </div>
                 
                 {videos.length > 0 && (
                      <div className={`${styles.remoteVideosContainer} ${showModal ? styles.withSidebar : ''}`}>
                           {videos.map((video)=>(
                             <div className={styles.remoteVideoCard} key={video.socketId}> 
                                 <video
                                     className={styles.remoteVideo}
                                     ref={(ref) => {
                                         if (ref && video.stream) {
                                             ref.srcObject = video.stream;
                                         }
                                     }}
                                     autoPlay
                                     playsInline
                                 />
                                 <h2 className={styles.remoteVideoLabel}>{video.socketId}</h2> 
                             </div>
                           ))}          
                      </div>
                 )}

                 {/* Action controls */}
                 <div className={`${styles.actionButtonsContainer} ${showModal ? styles.shiftLeft : ''}`}>
                     <button className={`${styles.controlButton} ${audio ? styles.active : ''}`} onClick={handleAudio}>
                          {audio ? <MicIcon /> : <MicOffIcon />}
                     </button>
                     <button className={`${styles.controlButton} ${styles.danger}`} onClick={handleEndCall}>
                          <CallEndIcon />
                     </button>
                     <button className={`${styles.controlButton} ${video ? styles.active : ''}`} onClick={handleVideo}>
                          {video ? <VideoCamIcon /> : <VideoCamOffIcon />}
                     </button>
                     <button className={`${styles.controlButton} ${screen ? styles.success : ''}`} onClick={handleScreen}>
                          {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                     </button>
                     <button className={`${styles.controlButton} ${showModal ? styles.active : ''}`} onClick={() => {
                          setModal(!showModal);
                          if (!showModal) setNewMessages(0);
                     }}>
                          <ChatIcon />
                          {newMessages > 0 && <span style={{ position: "absolute", top: -4, right: -4, background: "#ef4444", color: "white", borderRadius: "50%", padding: "2px 6px", fontSize: "10px", fontWeight: "bold" }}>{newMessages}</span>}
                     </button>
                 </div>

                 {/* Chat Side panel */}
                 {showModal && (
                      <div className={styles.chatRoom}>
                          <div className={styles.chatHeader}>
                              <h3 className={styles.chatTitle}>Meeting Space</h3>
                              <div className={styles.chatTabs}>
                                  <button 
                                      className={`${styles.chatTabButton} ${chatTab === 'chat' ? styles.active : ''}`}
                                      onClick={() => setChatTab('chat')}
                                  >
                                      Room Chat
                                  </button>
                                  <button 
                                      className={`${styles.chatTabButton} ${chatTab === 'ai' ? styles.active : ''}`}
                                      onClick={() => setChatTab('ai')}
                                  >
                                      ✨ AI Assistant
                                  </button>
                              </div>
                          </div>
                          
                          {chatTab === 'chat' ? (
                              <>
                                  <div className={styles.chatMessages}>
                                      {messages.map((msg, index) => (
                                          <div 
                                              key={index} 
                                              className={`${styles.messageBubble} ${msg.socketIdSender === socketIdRef.current ? styles.self : styles.other}`}
                                          >
                                              <div className={styles.messageSender}>{msg.sender}</div>
                                              <div className={styles.messageText}>{msg.data}</div>
                                          </div>
                                      ))}
                                  </div>
                                  <div className={styles.chatInput}>
                                      <input 
                                          className={styles.chatInputField}
                                          placeholder="Type message to room..." 
                                          value={message} 
                                          onChange={e => setMessage(e.target.value)} 
                                          onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                  sendMessage();
                                              }
                                          }}
                                      />
                                      <Button onClick={sendMessage} variant="contained" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', textTransform: 'none' }}>Send</Button>
                                  </div>
                              </>
                          ) : (
                              <>
                                  <div className={styles.chatMessages}>
                                      {aiMessages.map((msg, index) => (
                                          <div 
                                              key={index} 
                                              className={`${styles.messageBubble} ${msg.socketIdSender === socketIdRef.current ? styles.self : styles.ai}`}
                                          >
                                              <div className={styles.messageSender}>
                                                  {msg.sender === "AI Assistant" ? "🤖 AI Assistant" : msg.sender}
                                              </div>
                                              <div className={styles.messageText} style={{ whiteSpace: "pre-line" }}>{msg.data}</div>
                                          </div>
                                      ))}
                                      {isAiTyping && (
                                          <div className={styles.typingIndicator}>
                                              <span></span>
                                              <span></span>
                                              <span></span>
                                          </div>
                                      )}
                                  </div>
                                  <div className={styles.chatInput}>
                                      <input 
                                          className={styles.chatInputField}
                                          placeholder="Ask AI assistant..." 
                                          value={aiMessage} 
                                          onChange={e => setAiMessage(e.target.value)} 
                                          onKeyDown={e => {
                                              if (e.key === 'Enter') {
                                                  handleSendAiMessage();
                                              }
                                          }}
                                      />
                                      <Button onClick={handleSendAiMessage} variant="contained" style={{ borderRadius: '12px', background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)', textTransform: 'none' }}>Ask</Button>
                                  </div>
                              </>
                          )}
                      </div>
                 )}
            </div> 
            } 
        </div>
    )
}