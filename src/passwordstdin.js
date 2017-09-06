
// function to get a password from stdin
//note: returns a Promise of string password, as interaction is callback based
function getPasswordFromStdin(prompt='Please enter the password: '){

    //Apparently this is needed because the node developpers have gone FULL RETARD and made it
    // so the only way to get keypress events is to use the 'readline' library to add keypress
    // events to stdin...
    require('readline').emitKeypressEvents(process.stdin);

    return new Promise((resolve, reject)=>{

        //get current stdinState:
        captureStdinState();

        //if in TTY, set raw mode on stdin
        if(process.stdin.isTTY){
            process.stdin.setRawMode(true);
        }

        const EVENT = 'keypress';

        let captureString='';
        //event listener:
        const stdinPasswordCapture = (data, key) =>{

            if(isEscape(key)){
                processEscapeKey(key);
            } else if(isEndOfPassword(key)){
                process.stdin.removeListener(EVENT,stdinPasswordCapture);
                restoreStdinState();
                resolve(captureString);
            } else if (isBackspace(key)){
                if(captureString.length>0){
                    captureString = captureString.slice(0,-1);
                } else {
                    //give 'em a bell
                    process.stdout.write('\u0007');
                }
            } else {
                captureString += key.sequence;
            }
        };

        //setup the listener for keys:
        process.stdin.addListener(EVENT,stdinPasswordCapture);

        //write out the prompt
        process.stdout.write(prompt);

        /*This will then resolve in the event listener above.*/
    });
}

//------------------------------------
// Identifying end of password
function isEndOfPassword(key){
    const endSequences = ['\r','\n'];
    return endSequences.includes(key.sequence);
}

function isBackspace(key){
    return key.sequence === '\b';
}
//------------------------------------
// Escape key handling
const escapeKeys = [
    {
        sequence:'\u0003',
        action: ()=>{process.exit(1);}
    }
];
function isEscape(key){
    return escapeKeys.map(esc=>esc.sequence).includes(key.sequence);
}
function processEscapeKey(key){
    const action = escapeKeys.find(esc=>esc.sequence === key.sequence).action;
    if(action){
        action();
    } else {
        throw new Error(`action not specified for key ${JSON.stringify(key)}`);
    }
}
//------------------------------------
//StdIn state handling:
let STDIN_INIT_STATE = {};
function captureStdinState(){
    STDIN_INIT_STATE = {
        wasRaw: process.stdin.isRaw
    };
}
function restoreStdinState(){
    process.stdin.setRawMode(STDIN_INIT_STATE.wasRaw);  //change back the input stream mode
    process.stdin.unref();  //so program can exit if this is the only thing holding it back
}
//------------------------------------


//Event listener

module.exports = getPasswordFromStdin;
