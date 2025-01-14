const fs = require('fs');


let rooms = []; 

function log(text){
    var time = new Date();
    console.log("[" + time.toLocaleTimeString() + "] " + " " + text);
}

/**
 * Room handlers. 
 */
module.exports = {

    /**
     * Creates a new room with the code given. Also add the creator to the room's connection list.  Adds the username and the room-code to the connection list. 
     * @param {*} room_code the room code that the new room will have 
     * @param {*} connection the connection of the user that will create the room 
     * @param {*} username the username of the users to add into the connection. 
     * @throws {*} throws room already exists if the room already exists.  
    */
    createRoom: function(room_code, username,connection){
        log("Creating new room"); 

        let room = this.doesRoomExists(room_code);
        
        if(room){
            throw new Error("Room already exists"); 
        }

        //IMPORTANT IOUOUOUOUOU add room code to connection 
        connection.room_code = room_code;  

        //users are added on the connection based on the room code 
        let new_room = {
            code: room_code,
            room_history: [], //array of messages sent over the server 
            files_content:[], //array of file content sent over the server 
            users: [], 
        }

        //the user that created the room should be given elevated privilages for the connection 
        connection.creator = true; 
        connection.username = username; 
        //push the connection to the active users of the room 
        new_room.users.push(connection); 

        rooms.push(new_room); 
        log("Successfully created new room");
    },

    /**
     * Returns all sent messages in the room. 
     * @param {*} room_code The room code we want to retrive the message history for
     * @returns the message history of the room
     */
    getMessageHistory: function(room_code){
        let room = this.doesRoomExists(room_code); 

        if(!room){
            throw new Error("Room doesn't exist"); 
        }
        return room.room_history; 
    },

    /**
     * Adds a new message to the room's history. 
     * @param {*} room_code the room code that the message is going to be added to. 
     * @param {*} message the message added to the history 
     */
    addMessageToRoomHistory: function(room_code, message){
        let room = this.doesRoomExists(room_code); 

        if(!room){
            throw new Error("Room doesn't exist"); 
        }

        room.room_history.push(message);
        log("Added message to room history");
    },

    /**
     * Adds the file contents on to the file contents array in case the user wants to download it. 
     * @param {*} room_code the room code that is going to contain the file contents.
     * @param {*} contents the contents of the file. 
     */
    addFileContentsToFileContentsArray(room_code, contents){
        let room = this.doesRoomExists(room_code); 

        if(!room){
            throw new Error("Room doesn't exist"); 
        }
        room.files_content.push(contents); 
        log("Added file contents to room"); 
    },

    /**
     * Returns all connections with the specified room code. 
     * @param {*} room_code the room code that we want to receive the connections for
     * @returns the room and the connections (or connection) with the specified room code. These are encapsulated in an object {current_room: room, current_room_connections: room.users}
     * @throws {*} connection with the specified room code does not exist error
     */
    getConnectionsFromRoom: function(room_code){
        let room = this.doesRoomExists(room_code); 

        if(!room){
            throw new Error("Room doesn't exist"); 
        }
        log("Returning connections from room");
        return {
            current_room: room,
            current_room_connections: room.users,
        }; 
    },

    getUsernamesFromRoom: function(room_code){
        let current_room = null ,current_room_connections = null; 
        log("Returning usernames from room");
        try{
            ({current_room,current_room_connections} = this.getConnectionsFromRoom(room_code));
        }catch(err){
            throw err; 
        }
        let usernames = current_room_connections.map((connection) => {
            return {username:connection.username,id:connection.user_id}; 
        });
        return usernames; 
    },

    /**
     * Removes the client connection based on the roomcode and the client ID. This can be done not only when a connection terminates but 
     * when a privileged user wants to remove a user from the connection(reminder creator connections have the creator field set to true). 
     * @param {*} room_code the room code to find the client connection 
     * @param {*} clientID the client ID for find the corresponding connection we want to remove 
     * @throws {*} the error that getconnectionsFromRoom throws 
     */
    removeConnectionFromRoom: function(room_code, clientID){
        let current_room = null ,current_room_connections = null; 
        try{
            ({current_room,current_room_connections} = this.getConnectionsFromRoom(room_code));
        }catch(err){
            throw err; 
        }
        
        current_room_connections = current_room_connections.filter((connection) => {
            return clientID !== connection.user_id; 
        }); 

        current_room.users = current_room_connections; 
        //if length is equal to zero means no more users are using the room 
        if(!(current_room.users.length)){
            this.removeRoom(room_code); 
            this.removeFilesFromRoom(room_code);  
        }
        log("Removed connection from room");
    },

    /**
     * Removes a room from the active rooms. 
     * @param {*} room_code 
     */
    removeRoom: function(room_code){
        rooms = rooms.filter((room) => room_code !== room.code); 
        log("Removed room from active rooms");
    },

    /**
     * Removes all files for the specific room 
     * @param {*} room_code the room code we will delete the files for 
     */
    removeFilesFromRoom: function(room_code){
        log("Removing files from room");
        const targetString = `_${room_code}_`; 
        if(fs.existsSync('./files/')){
            fs.readdir('./files/', (err, files) => {
                if (err) {
                    // handle the error
                    log("Error: " + err + " while trying to remove files from room"); 
                    return;
                }
            
                // filter the file names that contain the target string
                const filteredFiles = files.filter((file) => file.includes(targetString));
                
                // delete the filtered files
                filteredFiles.forEach((file) => {
                    log("Removing file: " + file);
                    fs.unlink(`./files/${file}`, (unlinkErr) => {
                        if (unlinkErr) {
                        // handle the error
                        log("Unlink error: " + unlinkErr + " while removing file: " + file);
                        }
                    });
                });
            });
        }
    },

    /**
     * Adds user to the specific room if it exists. Adds the room_code and username to the connection and also specifies if the user is the creator. 
     * @param {*} room_code the room code that the user is going to be added to 
     * @param {*} connection the user connection that is going to be added to the room 
     * @param {*} username the username of the user connection. 
     * @throws {*} room doesn't exist error if room doesn't exist.  
    */
    addUserToRoom: function(room_code, username, connection){
        let room = this.doesRoomExists(room_code);
        if(!room){
            throw new Error("Room doesn't exist");   
        }
        //IMPORTANT IOUOUOUIOIOU add room code,username, creator to connection 
        connection.room_code = room_code;
        connection.username = username; 
        connection.creator = false; 
        if(room.users.length == 2){
            throw new Error("currently only two peers are supported");
        }
        //connection should have a user id accompanied with it from the initiation phase of the connection. 
        room.users.push(connection);
        log("Added new user:" + connection.user_id + " to room:" + room.code);
    },

    /**
     * Finds the OBJECT room with the specific room code. 
     * @param {*} room_code the room code that we'll check if it exists 
     * @returns {*} returns false if the room doesn't exist. Return the room OBJECT if the room exists. 
     */
    doesRoomExists: function(room_code){
        let room = rooms.find((room) => room.code === room_code);

        if(!room){
            return false; 
        }
        return room; 
    }
}