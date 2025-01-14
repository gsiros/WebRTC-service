import { webSocketConnect,getServerURL,sendNewTextMessage, closeWebSocketConnection,sendFileOverChat, getClientID } from "./websocket-connection-handler.js"
import {getLocalStream ,closePeerConnection} from "./peer-connection-handler.js";
import { media_functions } from "./media-handler.js";

let create_room_input = document.getElementById("create_roomcode"); 
let join_room_input = document.getElementById("join_roomcode"); 
let join_username_input = document.getElementById("join_username");
let join_room_button = document.getElementById("join-room-button");
function log(text){
    var time = new Date();
    console.log("[" + time.toLocaleTimeString() + "] " + text);
}
let loader = document.getElementsByClassName("loader")[0];
let messages = document.getElementsByClassName("messages")[0];

messages.onclick = function(event){
    if(event.target.id === "metadata_link"){
        const formData = new FormData(); 
        let clientID = event.target.parentElement.dataset.clientid; 
        let room_code = event.target.parentElement.dataset.roomcode; 
        let username = event.target.parentElement.dataset.username;
        let fileName =  event.target.parentElement.dataset.filename;
        formData.append('clientID', clientID);
        formData.append('room_code', room_code);
        formData.append('username', username);
        formData.append('filename',fileName);
        
        const params = new URLSearchParams(formData).toString();
        
        const url = `${window.location.protocol}//${getServerURL.get()}/Files?${params}`;
        
        fetch(url)
        .then(response => {
            if(!response.ok){
                throw new Error(response.statusText); 
            } 
            return response.blob();
        })
        .then(blob => {
            log("Turned file into blob");
            const file = new File([blob], fileName, { type: blob.type });
            // use saveAs to save the file to the user's device
            saveAs(file);
        })
        .catch((err) => {
            alert(err); 
            log("Error while saving file received from remote peer:" + err)
        });
    };
}

join_room_button.onclick = async function() {
    let value = join_room_input.value;
    let username = join_username_input.value; 
    let local_stream = await media_functions.getMedia({audio: true, video: true}); 
    try{
        if(!local_stream){
            throw new Error(" empty local stream"); 
        }
        loader.style.display = "block";
        webSocketConnect(value, "join", username); 
    }catch(err){
        alert("Error: " + err + " while trying to join the server")
    }

    

    
} 

let create_room_button = document.getElementById("create-room-button");
let create_username_input = document.getElementById("create_username");

create_room_button.onclick = async function() {
    let value = create_room_input.value; 
    let username = create_username_input.value; 
    let local_stream = await media_functions.getMedia({audio: true, video: true}); 
    try{
        if(!local_stream){
            throw new Error(" empty local stream"); 
        }
        loader.style.display = "block";
        webSocketConnect(value, "create", username); 
    }catch(err){
        alert("Error: " + err + " while trying to create the server")
    }   
    
}


let chat_input = document.getElementById("chat-input"); 

chat_input.addEventListener(("keypress"), function(event){
    let data = event.target.value; 
    if(data.length > 100){
        alert("Can't enter more that a hundred");
    }else if(event.key == "Enter"){
        sendNewTextMessage(data);
        event.target.value = ""; 
        //TODO HANDLE THE IMAGE BUTTON 
        let messages = document.getElementsByClassName("messages")[0];
        messages.scrollTop = messages.scrollHeight;
    }
})

let sendbutton = document.getElementById("send-button");

sendbutton.onclick = function (event) {
    let text = chat_input.value;
    if(text.length > 100){
        alert("Can't enter more that a hundred");
    }else {
        sendNewTextMessage(text);
        chat_input.value = ""; 
        //TODO HANDLE THE IMAGE BUTTON 
        let messages = document.getElementsByClassName("messages")[0];
        messages.scrollTop = messages.scrollHeight;
    }
};

let disconnect = document.getElementById("disconnect-image");
let camera = document.getElementById("camera-image");
let microphone = document.getElementById("microphone-image");
let chat = document.getElementsByClassName("chat")[0];
let toggle_chat_panel = document.getElementById("chat-image");
let fileInput = document.getElementById("file-input"); 
let room = document.getElementsByClassName("room")[0]; 
let chat_and_call = document.getElementsByClassName("chatandcall")[0];

disconnect.onclick = function(event){
    closePeerConnection(); 
    closeWebSocketConnection(); 
    room.style.display = "block"; 
    chat_and_call.style.display = "none"; 
}

camera.onclick = function(event){
    
    getLocalStream().getTracks().forEach((track) => {
        if (track.kind === 'video') {
            //inverts it each time 
            if (track.enabled == true) {
                track.enabled = false;
                camera.className = "fa-solid fa-video-slash";
            }else{
                track.enabled = true;
                camera.className = "fa-solid fa-video";
            }
        }
    }); 
}

microphone.onclick = function(event){
    getLocalStream().getTracks().forEach((track) => {
        if (track.kind === 'audio') {
            //inverts it each time 
            if (track.enabled == true) {
                track.enabled = false;
                microphone.className = "fa-solid fa-microphone-slash";
            }else{
                track.enabled = true;
                microphone.className = "fa-solid fa-microphone";
            }
        }
    }); 
}
// Add an event listener to the file input element to handle file selection
fileInput.onchange = function(event){
    // Get the selected file
    const file = event.target.files[0];
    
    // Send the file over the chat 
    sendFileOverChat(file);
};

toggle_chat_panel.onclick = function(event){
    let streams = document.getElementsByClassName("streams")[0];
    var mediaQans = window.matchMedia("(max-width: 1000px)");

    if(chat.style.display === "none"){
        chat.style.display = "grid";
        chat_and_call.style.gridTemplateColumns = null;
        if (mediaQans.matches) { // If media query matches
            streams.style.height = "fit-content";
        }
    }else{
        chat.style.display = "none";
        chat_and_call.style.gridTemplateColumns = "1fr";
        // Enlarge streams
        if(mediaQans.matches){
            streams.style.height = "86vh";
        }

    }  
}





