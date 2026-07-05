# Webextension Messages
Easily and neatly describe all communication instances between the background process and tabs in one place. Wait for the result from the message sent in the same instruction flow.  

## How to install and prepare
Install the library through
```sh
npm install webextension-messages
```
then import with
```js
import WebextensionMessages from 'webextension-messages'
```
in your script file.

## Usage
Library has only one method ```setup```, which creates all message-sending functions and sets up listeners.  
With such a signature:
```js
WebextensionMessages.setup (
  MessageHandlersMap {
    MessageSenderFunctionName1: MessageHandler1 (MessageParameters1) => ResultToSendBack1
    MessageSenderFunctionName2: MessageHandler2 (MessageParameters2) => ResultToSendBack2
    MessageSenderFunctionName3: MessageHandler3 (MessageParameters3) => ResultToSendBack3
    ...
  },
  CommunicationId
) =>
  MessageSendersMap {
    MessageSenderFunctionName1: (MessageParameters1) => PromiseWithResult1
    MessageSenderFunctionName2: (MessageParameters2) => PromiseWithResult2
    MessageSenderFunctionName3: (MessageParameters3) => PromiseWithResult3
    ...
    stopCommunication ()
  }
```
Where:  
```MessageHandlersMap``` - map linking sender and handler function on the receiving end  
```MessageSendersMap``` - map of sender functions  
  
```MessageSenderFunctionName``` - name of the function that will send the message  
```MessageHandler``` - function that will handle the message on the receiving end  
```MessageParameters``` - payload to the sender function and parameters for the handler function. Can be a primitive, or Array, or Object, anything that can be serialized    
```ResultToSendBack``` - return value of the handler function that will be sent back to the sender  
```PromiseWithResult``` - return value of the sender function, a promise that will be resolved to ```ResultToSendBack``` from the receiver  

```CommunicationId``` (optional) - string identifying the declared communication, used only for removing listeners  
```stopCommunication ()``` - special predefined method for stopping messaging and removing listeners, works only if ```CommunicationId``` is given  

  

  
**Important: the exact same ```setup``` method with the exact same arguments must run on both sides to ensure their proper communication!**

## Examples
Basic usage:
```js
// shared.js =>
// code that must be shared between the background and page scripts
import WebextensionMessages from 'webextension-messages'
const { multiply } = WebextensionMessages.setup({
  multiply: (x) => {
   const result =  x * 2 // this operation will be done on the recipient side (background or tab, depending on who sent the message to whom)
   return result; // result goes back to the sender, the one initiated multiply() call
  }
})
export { multiply };


// background-script.js =>
// if there's no sender functions for one of the ends, just import the file to set up listeners
import from "./shared.js"


// content-script.js =>
import { multiply } from "./shared.js"; // import sender function
const result = await multiply(1); // a tab sends a message to the background and waits for the result, result Promise will be fulfilled with the background answer at some point
console.log(result);
// 2
```

Stop messaging and remove listeners:
```js
// setting up communication
cosnt { stopCommunication } = WebextensionMessages.setup({
  doSomething: () => "Done something", 
}, "Some messages");
// give the communication an identifier "Some messages" for both sides to know what set of functions is under discussion

// stopping it somewhere lower in the code
stopCommunication();
// no more listening for doSomething() messages 
```