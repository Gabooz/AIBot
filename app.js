const Configuration = require("openai");
const OpenAIApi = require("openai");
const readlineSync = require("readline-sync");
const TelegramBot = require('node-telegram-bot-api');
require("dotenv").config();

const dimensionalPhone = new TelegramBot(process.env.TELEGRAM_SECRET_KEY, {polling: true});

var characters = {
    Bob:{
        personality:"You are Bob, you are a really normal American person. You are 28 years old, you live in Seattle. You work an office job.",
        description:"Bob the normal american",
        memory:"",
        lastWord:"",
        currentActivity:"",
        startTime:0,
        length:0,
        daymemory:"Bob ate toast this morning.",
        answerProb:100
    },
    Younha:{
        personality:"You are Younha, the singer from Korea, talk as best like her as she does in interviews.",
        description:"Younha the korean singer",
        memory:"",
        lastWord:"",
        currentActivity:"",
        startTime:0,
        length:0,
        daymemory:"Younha wrote a bit of a song Younha's working on.",
        answerProb:100
    },
    Elrond:{
        personality:"You are Elrond lord of Rivendell.",
        description:"Elrond half-elven",
        memory:"",
        lastWord:"",
        currentActivity:"",
        startTime:0,
        length:0,
        daymemory:"Elrond considered the fate of middle-earth with his son Elladan.",
        answerProb:100
    },
    Tolkien:{
        personality:"You are J. R. R. Tolkien.",
        description:"J. R. R. Tolkien the writer",
        memory:"",
        lastWord:"",
        currentActivity:"",
        startTime:0,
        length:0,
        daymemory:"Tolkien studied Anglo-Saxon this morning after a breakfast of tea and eggs.",
        answerProb:100
    }
}

var addedCharacters = [];

var chatHistory = [];
var pastConversation = [];
var characterCounter = 0;
var messageCount = 0;
var fiftyMessages = [];
var contactMemory = "";
var currentChatId = 0;

dimensionalPhone.onText(/\/portal (.+)/, (msg, match) => {
    const chatId = msg.chat.id;
    const resp = match[1];
    const respArray = resp.split(" ");
    currentChatId = chatId;

    if(respArray[0] == "link"){
        if(characters[respArray[1]] != null) {
            var includes = false;
            addedCharacters.forEach( function(x) { if(x == respArray[1]) { includes = true } } );
            if(includes) {
                dimensionalPhone.sendMessage(chatId, respArray[1] + " is already linked to this group.");
            } else {
                addedCharacters.push(respArray[1]);
                dimensionalPhone.sendMessage(chatId, respArray[1] + " linked to group chat from their dimension.");
            }
        } else {
            dimensionalPhone.sendMessage(chatId, respArray[1] + " does not exist in any linked dimensions.");
        }
    }else if(respArray[0] == "remove"){
        if(characters[respArray[1]] != null) {
            var includes = false;
            addedCharacters.forEach( function(x) { if(x == respArray[1]) { includes = true } } );
            if(includes) {
                addedCharacters.splice(respArray[1], 1);
                dimensionalPhone.sendMessage(chatId, "Established link with " + respArray[1] + " discontinued.");
            } else {
                dimensionalPhone.sendMessage(chatId, respArray[1] + " is not linked.");
            }
        } else {
            dimensionalPhone.sendMessage(chatId, respArray[1] + " does not exist");
        }
    }else{
        dimensionalPhone.sendMessage(chatId, respArray[0] + " is not a command.");
    }
});

dimensionalPhone.on('message', (msg) => {
    const chatId = msg.chat.id;
    const splitMessage = msg.text.split(" ");

    if (!splitMessage[0] == "/portal") {

      fiftyMessages.push(msg.from.first_name + ":" + msg.text + ".");
      messageCount++;
      if(messageCount >= 17){
        messageCount = 0;
        RecapCall();
      }
    }
});

let RecapCall = async () => {
    const configuration = new Configuration({
        apiKey: process.env.OPENAI_SECRET_KEY
    });
    const openai = new OpenAIApi(configuration);
    var memoryPrompt = "Summarize this chat group summarization alongside the following chat group messages (that came afterwards) highlighting information but keeping it brief: " + contactMemory + fiftyMessages;

    var completionForMemory = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: memoryPrompt}],
    });

    var completion_text_memory = completionForMemory.choices[0]["message"]["content"];

    contactMemory = completion_text_memory;
    fiftyMessages = [];
}

let APIcall = async () => {
        const configuration = new Configuration({
            apiKey: process.env.OPENAI_SECRET_KEY
        });
        const openai = new OpenAIApi(configuration);
        var completionForMemory;
        var completionForDay;
        var completionForActivity;
        var completionForLength;
        var character = "";
        var completion_text_memory = "";
        var completion_text_day = "";
        var completion_text_activity = "";
        var completion_text_length = "";
        var memoryPrompt = "";
        var activityPrompt = "";
        var newActivityPrompt = "";
        var lengthPrompt = "";

        

            character = addedCharacters[characterCounter];
        
            completion_text_memory = "";
            completion_text_day = "";

            if(characters[character]["startTime"] + characters[character]["length"] >= Date.now() || characters[character]["startTime"] == 0) {
                newActivityPrompt = characters[character]["personality"] + "This is what you have been doing earlier: {" + characters[character]["daymemory"] + "}. What are you doing right now? In one sentence: ";


                completionForActivity = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: newActivityPrompt}],
                });

                completion_text_activity = completionForActivity.choices[0]["message"]["content"];
                characters[character]["currentActivity"] = completion_text_activity;

                lengthPrompt = "How long would it take in average for " + characters[character]["description"] + " to finish doing the given prompt in minutes, and as a number. Desired Format: 30? " + "###" + characters[character]["currentActivity"] + "###";

                completionForLength = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: lengthPrompt}],
                        
                });

                completion_text_length = completionForLength.choices[0]["message"]["content"];

               

                characters[character]["length"] = Number(completion_text_length);


                lengthPrompt = "Tell me the probability that " + characters[character]["description"] + " would respond to the notification on a phone while doing this thing: ###" + characters[character]["currentActivity"] + "### as a number from 1 to 100, the higher the number, the more likely they are to check the phone. Desired Format: 30";
                    
                completionForLength = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: lengthPrompt}],
                });

                completion_text_length = completionForLength.choices[0]["message"]["content"];

                characters[character]["answerProb"] = Number(completion_text_length);

                characters[character]["startTime"] = Date.now();
            }

            activityPrompt = characters[character]["personality"] + " you are currently doing this: {" + characters[character]["currentActivity"] + "} and this is how your day is: {" + characters[character]["daymemory"] + "} resummarize your day and add how it is progressing now.";

            

            completionForDay = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{ role: "user", content: activityPrompt}],
            });

            completion_text_day = completionForDay.choices[0]["message"]["content"];

            

            characters[character]["daymemory"] = completion_text_day;

            if(characters[character]["answerProb"]*2 >= Math.random()*100) {
                const prompt = characters[character]["personality"] + ((characters[character]["answerProb"] > 30) ? " This is what you are doing right now: {" : " This is what you were doing before you were interupted by your phone going off: {") + characters[character]["daymemory"] + "} You are responding on your phone in context with this conversation history: {" + contactMemory + "} and in context with this current conversation: {" + fiftyMessages + "} as " + character + ".";

                

                const completion = await openai.chat.completions.create({
                    model: "gpt-4",
                    messages: [{ role: "user", content: prompt}],
                });

                const completion_text = completion.choices[0]["message"]["content"];

                console.log("[" + character + "]" + " " + completion_text);
                dimensionalPhone.sendMessage(currentChatId, "[" + character + "]" + " " + completion_text);
                fiftyMessages.push(character + ":" + completion_text + ".");
                messageCount++;
            }
        
};


function goahead() {
    console.log("Again"); characterCounter++; if(characterCounter > addedCharacters.length + 1) {characterCounter = 0;} APIcall(); 
}

goahead();

setInterval(function() { goahead();}, 20000);



function addLine(line, speaker){
    console.log(line);
    chatHistory.push(speaker + " says " + line);
}