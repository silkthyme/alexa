// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
// dependencies

const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');

// var AWS = require('aws-sdk');
// var util = require('util');
// var s3 = new AWS.S3();

const {
    getSlotValue,
    getIntentName,
    getRequestType,
    getDialogState,
} = require('ask-sdk-core');

// global scope
var s3Attributes = {};
//var guardianLookup = {};
var eventLookup = {};
var makerspaceLookup = {};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to Roster. You can check in, check out, register, or pick up your child. Which would you like to do?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        const speechText = 'You can say hello to me! How can I help?';

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        const speechText = 'Goodbye!';
        return handlerInput.responseBuilder
            .speak(speechText)
            .getResponse();
    }
};
const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        // Any cleanup logic goes here.
        return handlerInput.responseBuilder.getResponse();
    }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);
        const speechText = `Sorry, I couldn't understand what you said. Please try again.`;

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// const addGuardianHelper = (name, guardianName) => {
//     s3Attributes[name].guardians.push(guardianName);
//     if (guardianLookup.hasOwnProperty(guardianName)) {
//         guardianLookup[guardianName].push(name);
//     }
//     guardianLookup[guardianName] = {};
//     guardianLookup[guardianName].children = [name];
// }

// const AddNewGuardianHandler = {
//     canHandle(handlerInput) {
//         return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
//             && Alexa.getIntentName(handlerInput.requestEnvelope) === 'NewGuardian';
//     },
//     handle(handlerInput) {
//         const attributesManager = handlerInput.attributesManager;
        
//         const guardianName = getSlotValue(handlerInput.requestEnvelope, 'guardian_first_name');
//         const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
//         var speechText;
//         if (name && s3Attributes.hasOwnProperty(name)) {
//             if (guardianName) {
//                 addGuardianHelper(name, guardianName);
//             }
//             else {
//                 speechText = "What is the name of the legal guardian?";
//                 return handlerInput.responseBuilder
//                         .speak(speechText)
//                         .reprompt(speechText)
//                         .getResponse();
//             }
//         } else if (name) {
//             speechText = name + " is not registered as a student here! If you would like to register your student, please say register " + name;   
//         } else {
//             speechText = "What is the name of the student?"
//             return handlerInput.responseBuilder
//             .speak(speechText)
//             .reprompt(speechText)
//             .getResponse();
//         }
        
//         attributesManager.setPersistentAttributes(s3Attributes);
//         attributesManager.savePersistentAttributes();
//         attributesManager.setPersistentAttributes(guardianLookup);
//         attributesManager.savePersistentAttributes();
        
//         return handlerInput.responseBuilder
//             .speak(speechText)
//             .getResponse();
//     }    
// };


const CheckInIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckIn';
    },
    handle(handlerInput) {
        const checkInName = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        var speechText = '';
        if (checkInName) {
            speechText += setCheckInStatus(checkInName, true, handlerInput);
        } else {
            speechText = 'What is your students name?';
        }
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt()
            .getResponse();
    }
};

const CheckOutIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckOut';
    },
    handle(handlerInput) {
        const checkOutName = getSlotValue(handlerInput.requestEnvelope, 'check_out_first_name');
        var speechText = '';
        if (checkOutName) {
            speechText += setCheckInStatus(checkOutName, false, handlerInput);
        } else {
            speechText = `What is your student's name?`;
        }
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt()
            .getResponse();
    }
};

const CheckInDisplayHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'CheckInDisplay';
    },
    handle(handlerInput) {
        const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        var speechText = name;
        var status = getCheckInStatus(name, handlerInput);
        if (status === null) {
            speechText += " is not registered as a student here! If you would like to register your student, please say register " + name;
        } else {
            if (status) {
                speechText += " is checked in.";
            } else {
                speechText += " is not checked in.";
            }
        }
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt()
            .getResponse();
    }    
};

const DeregisterStudentHandler =  {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeregisterStudent';
    },
    handle(handlerInput) {
        const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        var speechText = '';
        if (name) {
            const attributesManager = handlerInput.attributesManager;
            if (s3Attributes.hasOwnProperty(name)) {
                delete s3Attributes[name];
                speechText = "Deregistered " + name;
            } else {
                speechText = name + " was never registered!";    
            }
            attributesManager.setPersistentAttributes(s3Attributes);
            attributesManager.savePersistentAttributes();
        } else {
            speechText = "Who would you like to deregister?";

        }
    
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
    
};

const RegisterStudentHandler =  {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RegisterStudent';
    },
    handle(handlerInput) {
        const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        //const guardianName = getSlotValue(handlerInput.requestEnvelope, 'guardian_first_name');
        var speechText = '';
        const attributesManager = handlerInput.attributesManager;
        if (name) {
            //if (guardianName) {
                
               // addNewStudent(name, guardianName, attributesManager);
                if (!s3Attributes.hasOwnProperty(name)) {
                     s3Attributes[name] = {};
                     s3Attributes[name].checkedIn = false;
                     speechText = "Registered " + name;
                } else {
                    speechText = "Student is already registered!";
                }
                // var accessCode = Math.floor(Math.random()*9000) + 1000;
                // speechText += " Your access code is " + accessCode;
                // guardianLookup[guardianName].accessCode = accessCode;
               
            // } else {
            //     speechText = "What is the name of the legal guardian?";
            //     return handlerInput.responseBuilder
            //     .speak(speechText)
            //     .reprompt(speechText)
            //     .getResponse();
            // }
        } else {
            speechText = "Who would you like to register?";

        }
         attributesManager.setPersistentAttributes(s3Attributes);
        attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
    
};

const getCheckInStatus = (name, handlerInput) => {
    const attributesManager = handlerInput.attributesManager;
    if (s3Attributes.hasOwnProperty(name)) {
        const checkOutstatus = s3Attributes[name].checkedIn;
        return checkOutstatus;
    } else {
        return null;
    }
}

const setCheckInStatus = (name, value, handlerInput) => {
    const attributesManager = handlerInput.attributesManager;
    if (getCheckInStatus(name, handlerInput) === null) {
            speechText = name + " is not registered as a student here! If you would like to register your student, please say register " + name;
            return speechText;
    }
    var speechText;
    if (s3Attributes[name].checkedIn === value) {
        if (value) {
            speechText = name + " is already here and checked in at " + s3Attributes[name].checkInTime + " !";
        } else {
            speechText = name + " is already checked out since " + s3Attributes[name].checkOutTime + " !";
        }
    } else {
        var today = new Date();
        var time = today.getHours() + ":" + today.getMinutes();
        if (value) {
            speechText = "Checked in " + name;
            s3Attributes[name].checkInTime = time;
            s3Attributes[name].checkOutTime = null; //reset checkouttime from yesterday
        } else {
            speechText = "Signed out " + name;
            s3Attributes[name].checkOutTime = time; 
            s3Attributes[name].checkInTime = null; //comment out this line to see both times afterwards
        }
        s3Attributes[name].checkedIn = value;
    }
    attributesManager.setPersistentAttributes(s3Attributes);
    attributesManager.savePersistentAttributes();
    return speechText;
};

const addNewStudent = (name, attributesManager) => {
//const addNewStudent = (name, guardianName, attributesManager) => {
    if (!s3Attributes.hasOwnProperty(name)) {
        s3Attributes[name] = {};
        //s3Attributes[name].guardians = [];
        // if (guardianName) {
        //     addGuardianHelper(name, guardianName);
        // }
    }
};

const RosterSizeHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'RosterSize';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var result = HelpRosterIntentHandler();
        var count = result.length;
        console.log(result.length);
        var speechText;
        if (count === 1) {
            speechText = `There is ${count} student in the building.`;
        } else {
            speechText = `There are ${count} students in the building.`;
        }
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const RosterIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Roster';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        var result = HelpRosterIntentHandler();
        var count = result.length;
        if (count === 0) {
            console.log(s3Attributes);
            console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>');
            speechText = 'No one is present.';
        }
        else if (count === 1) {
            speechText = "The only person present is " + result[0];
        } else {
            var remainingStudents = "";
            for (var i = 0; i < count - 1; i++) {
                remainingStudents += result[i] + ", ";
            }
            remainingStudents += " and " + result[count-1];
            speechText = `The people present are ${remainingStudents}`;
        }
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const HelpRosterIntentHandler = () => {
    var result = [];
        for (var p in s3Attributes) {
            if (s3Attributes[p].checkedIn === true) {
                console.log("inside if statement");
                result.push(p);
                console.log(result);
          }
        }
    return result;
}

const PickupIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'Pickup';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        var name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        //var guardianName = getSlotValue(handlerInput.requestEnvelope, 'guardian_first_name');
        var time = getSlotValue(handlerInput.requestEnvelope, 'scheduled_pickup_time');
        
        if (!name) {
            speechText = "Please state the student's name.";

            //name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        } else if (!time) {
            speechText = "What time will you be picking them up?";
  
            //time = getSlotValue(handlerInput.requestEnvelope, 'scheduled_pickup_time');
        } else {
                s3Attributes[name].scheduled_pickup_time = time;
                speechText = "Okay, I have noted down that " + name + " will be picked up " + " at " + (parseInt(time)%12);
            
            }
            attributesManager.setPersistentAttributes(s3Attributes);
            attributesManager.savePersistentAttributes();
            // attributesManager.setPersistentAttributes(guardianLookup);
            // attributesManager.savePersistentAttributes();
        
        
        // if (!guardianName) {
        //     speechText = "Please state the guardian's name.";
        //     return handlerInput.responseBuilder
        //     .speak(speechText)
        //     .reprompt(speechText)
        //     .getResponse();
        //     //guardianName = getSlotValue(handlerInput.requestEnvelope, 'guardian_first_name');
        // } else if (!name) {
        //     speechText = "Please state the student's name.";
        //     return handlerInput.responseBuilder
        //     .speak(speechText)
        //     .reprompt(speechText)
        //     .getResponse();
        //     //name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        // } else if (!time) {
        //     speechText = "What time will you be picking them up?";
        //     return handlerInput.responseBuilder
        //     .speak(speechText)
        //     .reprompt(speechText)
        //     .getResponse();
        //     //time = getSlotValue(handlerInput.requestEnvelope, 'scheduled_pickup_time');
        // } else {
        //     if (guardianLookup.hasOwnProperty(guardianName) && guardianLookup[guardianName].children.includes(name)) {
        //         s3Attributes[name].scheduled_pickup_time = time;
        //         speechText = "Okay, I have noted down that " + guardianName + " will pick up " + name + " at " + (parseInt(time)%12);
        //     } else {
        //         speechText = "YOU ARE NOT REGISTERED AS A GUARDIAN OF THIS STUDENT!";
        //     }
        //     attributesManager.setPersistentAttributes(s3Attributes);
        //     attributesManager.savePersistentAttributes();
        //     attributesManager.setPersistentAttributes(guardianLookup);
        //     attributesManager.savePersistentAttributes();
        // }

        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const CheckPickupTimeHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'PickupTime';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        var name = getSlotValue(handlerInput.requestEnvelope, 'pick_up_name');

        if (!name) {
            speechText = "Please state the student's name.";
        } else {
            if (s3Attributes.hasOwnProperty["Abby"]) {
                var time = s3Attributes["Abby"].scheduled_pickup_time ;
            speechText = "Okay, the scheduled pickup time for " + name + " is at " + (parseInt(time)%12);
            
            } else {
            
                speechText = name + " not found!";
            
            // attributesManager.setPersistentAttributes(guardianLookup);
            // attributesManager.savePersistentAttributes();
            }
        }
        attributesManager.setPersistentAttributes(s3Attributes);
            attributesManager.savePersistentAttributes();
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const AddNewEventHandler = {
   canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EventCreate';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        const type = getSlotValue(handlerInput.requestEnvelope, 'EventType');
        const date = getSlotValue(handlerInput.requestEnvelope, 'EventDate');
        const time = getSlotValue(handlerInput.requestEnvelope, 'EventTime');
        const duration = getSlotValue(handlerInput.requestEnvelope, 'EventDuration');
        const food = getSlotValue(handlerInput.requestEnvelope, 'EventFood');
        
        if (!type) {
            speechText = "What is the name of the event you are creating?"
        } else if (!date) {
            speechText = "What date is the event?"
        } else if (!time) {
            speechText = "When does the event start?"
        } else if (!duration) {
            speechText = "How long is the event?"
        } else if (!food) {
            speechText = "What food is at the event?"
        } else {
            if (!eventLookup.hasOwnProperty[type]) {
                eventLookup[type] = {};
            }
            eventLookup[type].date = date;
            eventLookup[type].time = time;
            eventLookup[type].duration = duration;
            eventLookup[type].food = food;
            speechText = "Event Created! " + type + " night on " + date + " at " + time + " for " + duration + " and will be serving " + food;
        }
  
            attributesManager.setPersistentAttributes(eventLookup);
            attributesManager.savePersistentAttributes();
        
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    } 
    
}

const RegisterEventHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'EventRegister';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');
        const event = getSlotValue(handlerInput.requestEnvelope, 'event');

        if (!event) {
            speechText = "What is the event name you would like to register for?";
        } else if (!name) {
            speechText = "What is your name?"
        } else {
            if (!s3Attributes.hasOwnProperty(name)) {
                speechText = name + " need to first register as a member of the Boys and Girls Club!";
            }
            else if (eventLookup.hasOwnProperty(event)) {
                if (eventLookup[event].hasOwnProperty("attendees")) {
                    eventLookup[event].attendees = [name];
                } else {
                    eventLookup[event].attendees.push(name);
                }
            } else {
                speechText = "Cannot find event";
            }
            attributesManager.setPersistentAttributes(eventLookup);
            attributesManager.savePersistentAttributes();
        }
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

const AddNewSpaceHandler = {
   canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SpaceCreate';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        const makerspace = getSlotValue(handlerInput.requestEnvelope, 'Makerspace') 
                    || getSlotValue(handlerInput.requestEnvelope, 'Makerspace_')
                    || getSlotValue(handlerInput.requestEnvelope, 'Makerspace__');
        
        if (!makerspace) {
            speechText = "What makerspace are you adding?"
        } else {
            if (!makerspaceLookup.hasOwnProperty[makerspace]) {
                makerspaceLookup[makerspace] = {};
                speechText = "This space has been added!"
            } else {
                speechText = "This space has already been added!"
            }
        }
  
            attributesManager.setPersistentAttributes(makerspaceLookup);
            attributesManager.savePersistentAttributes();
        
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    } 
    
};

const ReserveSpaceHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'SpaceReserve';
    },
    handle(handlerInput) {
        const attributesManager = handlerInput.attributesManager;
        var speechText;
        
        const makerspace = getSlotValue(handlerInput.requestEnvelope, 'Makerspace') 
                    || getSlotValue(handlerInput.requestEnvelope, 'Makerspace_')
                    || getSlotValue(handlerInput.requestEnvelope, 'Makerspace__');
        var time = getSlotValue(handlerInput.requestEnvelope, 'Time');
        const date = getSlotValue(handlerInput.requestEnvelope, 'Date');
        const name = getSlotValue(handlerInput.requestEnvelope, 'student_first_name');


        if (!makerspace) {
            speechText = "What makerspace are you adding?"
        } else if (!name) {
            speechText = "What is your name?"
        } else if (!s3Attributes.hasOwnProperty(name)) {
           speechText = "You are not registered as a member of Boys and Girls Club!";
        } else if (!date) {
            speechText = "What date are you reserving it for?"
        } else if (!time) {
            speechText = "What hour are you reserving it for - 4, 5, 6, 7 or 8?"
        } else if (4 > Math.round(time) || Math.round(time) > 8) {
            speechText = "Please pick a valid time. What hour are you reserving it for - 4, 5, 6, 7 or 8?"
        } else {
            time = Math.round(time);
            if (!makerspace.hasOwnProperty(date)) {
                makerspace[date] = {time: name};
                speechText = "Successfully reserved!";
            } else if (makerspace[date].hasOwnProperty(time)) {
                speechText = "Sorry, this space has already been reserved on " + date + " at " + time +
                    " by " + makerspace[date][time];
            } else {
                makerspace[date][time] = name;
                speechText = "Successfully reserved!";
            }
            
        }
        
            attributesManager.setPersistentAttributes(makerspaceLookup);
            attributesManager.savePersistentAttributes();
        
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        AddNewEventHandler,
        //AddNewGuardianHandler,
        CheckInIntentHandler,
        CheckInDisplayHandler,
        CheckOutIntentHandler,
        DeregisterStudentHandler,
        RegisterEventHandler,
        RegisterStudentHandler,
        RosterSizeHandler,
        RosterIntentHandler,
        PickupIntentHandler,
        CheckPickupTimeHandler,
        ) 
    .addErrorHandlers(
        ErrorHandler)
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .lambda();
