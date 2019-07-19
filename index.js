// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const Alexa = require('ask-sdk-core');

const {
    getSlotValue,
    getIntentName,
    getRequestType,
    getDialogState,
} = require('ask-sdk-core');

// 1. import ask persistence adapter
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');


var s3Attributes = {};
// // //global scope

// const attributesManager = globalHandlerInput.attributesManager;
//     var s3Attributes = {"Christina":
//                             {"checkedIn":true},
//                         "Abby":
//                             {"checkedIn":false},
//                         "Raj":
//                             {"checkedIn":true},
//                         "Bart":
//                             {"checkedIn":false},
//                         "Jose":
//                             {"checkedIn":false}
//                         };
// attributesManager.setPersistentAttributes(s3Attributes);
// attributesManager.savePersistentAttributes();
    

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const speechText = 'Welcome to Roster. You can check in, check out, or pick up your child. Which would you like?';
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
            .getResponse();
    }
};
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
            speechText = 'Who would you like to check in?';
        }
        // setCheckInStatus(checkInName, true, handlerInput);
        return handlerInput.responseBuilder
            .speak(speechText)
            .reprompt(speechText)
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
            speechText = `Please say check out student name`;
        }
        // setCheckInStatus(checkOutName, false, handlerInput);
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
        //var s3Attributes =  attributesManager.getPersistentAttributes() || {};
        var result = '';
        for (var p in s3Attributes) {
            if (s3Attributes.hasOwnProperty(p) && s3Attributes[p].checkedIn === true) {
                console.log("inside if statement");
                result += p + ",";
                console.log(result);
          }
        }
        //result = Object.keys(s3Attributes);
        var speechText;
        if (result === '') {
            console.log(s3Attributes);
            console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>');
            speechText = 'No one is present.';
        } else {
            speechText = `The people present are ${result}`;
        }
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

// const CheckInDisplayHandler = {
//     canHandle(handlerInput){
//         return handlerInput.requestEnvelope.request.type === 'IntentRequest'
//             && handlerInput.requestEnvelope.request.intent.name === 'check_in_display_intent';
//     },
//     async handle(handlerInput) {
//     let speechOutput = `Hi there, Hello World! Your saved counter is ${s3Attributes[name].checkedIn}`;

//     return handlerInput.responseBuilder
//         .speak(speechOutput)
//         .getResponse();
//     }
// }

// This handler acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.
exports.handler = Alexa.SkillBuilders.custom()
    .addRequestHandlers(
        LaunchRequestHandler,
        CheckInIntentHandler,
        CheckOutIntentHandler,
        RosterIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler,
        //CheckInDisplayHandler
        ) 
    .addErrorHandlers(
        ErrorHandler)
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .lambda();
    
const getCheckInStatus = (name, handlerInput) => {
    const attributesManager = handlerInput.attributesManager;
    //var s3Attributes =  attributesManager.getPersistentAttributes() || {};
    const checkOutstatus = s3Attributes[name].checkedIn;
    //const checkOutstatus = s3Attributes.checkedIn;
    return checkOutstatus;
}

const setCheckInStatus = (name, value, handlerInput) => {
    const attributesManager = handlerInput.attributesManager;
    // var s3Attributes =  attributesManager.getPersistentAttributes() || {};
    if (!(s3Attributes[name])) {
        addNewStudent(name, attributesManager);
    }
    //var attrToAdd = {"checkedIn":1};
    var speechText;
    if (s3Attributes[name].checkedIn === value) {
        if (value) {
            speechText = name + " is already here!";
        } else {
            speechText = name + " is already checked out!";
        }
    } else {
        if (value) {
            speechText = "Checked in " + name;
        } else {
            speechText = "Signed out " + name;
        }
        s3Attributes[name].checkedIn = value;
        attributesManager.setPersistentAttributes(s3Attributes);
        attributesManager.savePersistentAttributes();
    }
    return speechText;
}

const addNewStudent = (name, attributesManager) => {
    s3Attributes[name] = {};
}


/* The following example retrieves an object for an S3 bucket. */

 /*var params = {
  Bucket: "newBucket", 
  Key: "hopeItWorks"
 };
 s3.getObject(params, function(err, data) {
   if (err) console.log(err, err.stack); // an error occurred
   else     console.log(data);           // successful response
   /*
   data = {
    AcceptRanges: "bytes", 
    ContentLength: 3191, 
    ContentType: "image/jpeg", 
    ETag: "\"6805f2cfc46c0f04559748bb039d69ae\"", 
    LastModified: <Date Representation>, 
    Metadata: {
    }, 
    TagCount: 2, 
    VersionId: "null"
   }
   */
/* });*/


