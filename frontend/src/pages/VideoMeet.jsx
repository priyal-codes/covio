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
                    />
                    <Button variant="contained" onClick={connect} fullWidth>Connect</Button>
                </div>
             </div> : <div className={styles.meetContainer}>
            
                 <div className={`${styles.localVideoContainer} ${videos.length === 0 ? styles.alone : ''}`}>
                     <video
                         className={styles.localVideo}
                         ref={setLocalVideoRef}
                         autoPlay
                         muted
                     />
                 </div>
                 
                 {videos.length > 0 && (
                     <div className={styles.remoteVideosContainer}>
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
                 <div className={styles.actionButtonsContainer}>
                     <IconButton style={{ color: "white" }} onClick={handleAudio}>
                         {audio ? <MicIcon /> : <MicOffIcon />}
                     </IconButton>
                     <IconButton style={{ color: "red" }} onClick={handleEndCall}>
                         <CallEndIcon />
                     </IconButton>
                     <IconButton style={{ color: "white" }} onClick={handleVideo}>
                         {video ? <VideoCamIcon /> : <VideoCamOffIcon />}
                     </IconButton>
                     <IconButton style={{ color: "white" }} onClick={handleScreen}>
                         {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                     </IconButton>
                     <IconButton style={{ color: "white" }} onClick={() => {
                         setModal(!showModal);
                         if (!showModal) setNewMessages(0);
                     }}>
                         <ChatIcon />
                         {newMessages > 0 && <span style={{ color: "red", fontSize: "12px", marginLeft: "4px" }}>{newMessages}</span>}
                     </IconButton>
                 </div>

                 {/* Chat Side panel */}
                 {showModal && (
                     <div className={styles.chatRoom}>
                         <div className={styles.chatHeader}>
                             Chat Room
                         </div>
                         <div className={styles.chatMessages}>
                             {messages.map((msg, index) => (
                                 <div 
                                     key={index} 
                                     className={`${styles.messageBubble} ${msg.socketIdSender === socketIdRef.current ? styles.self : ''}`}
                                 >
                                     <div className={styles.messageSender}>{msg.sender}</div>
                                     <div className={styles.messageText}>{msg.data}</div>
                                 </div>
                             ))}
                         </div>
                         <div className={styles.chatInput}>
                             <input 
                                 placeholder="Type message..." 
                                 value={message} 
                                 onChange={e => setMessage(e.target.value)} 
                                 onKeyDown={e => {
                                     if (e.key === 'Enter') {
                                         sendMessage();
                                     }
                                 }}
                                 style={{ 
                                     color: "white", 
                                     flex: 1, 
                                     background: "transparent", 
                                     border: "none", 
                                     borderBottom: "1px solid white", 
                                     padding: "4px",
                                     outline: "none"
                                 }}
                             />
                             <Button onClick={sendMessage} variant="contained">Send</Button>
                         </div>
                     </div>
                 )}
            </div> 
            } 
        </div>
    )
}