const XMLHttpRequest = require("xmlhttprequest").XMLHttpRequest;
var registrationJSON = {
    "@class": "Application",
    "uuid": "e27275a4-bf01-488e-a878-22e279173113",
    "name": "Workload Chart",
    "description": "A workload chart in JSON format.",
    "token": "73113",
    "events": [
        {
            "@id": projectId,
            "eventId": "updatedText",
            "name": "Workload Chart",
            "description": "A workload chart in JSON format.",
            "dataFormat": {
                "dataObject": {
                    "$ref": "/definition/Object"
                },
                "Object": {
                    "type": "object",
                    "properties": {
                        "station": [{
                            "$ref": "#/definition/Station"
                        }]
                    }
                },
                "Station": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "name": "string"
                        },
                        "works": [{
                            "$ref": "#/definition/Work"
                        }]
                    }
                },
                "Work": {
                    "type": "object",
                    "properties": {
                        "WorkType": {
                            "type": "string"
                        },
                        "ProductName": {
                            "type": "string"
                        },
                        "ProductionProcessName": {
                            "type": "string"
                        },
                        "ProcessIndex": {
                            "type": "number"
                        },
                        "Count": {
                            "type": "number"
                        },
                        "StartTime": {
                            "type": "number"
                        },
                        "Duration": {
                            "type": "number"
                        }
                    }
                }
            }
        }
    ],
    "functions": [],
    "endpoints": []
  };

  registrationJSONStr = JSON.stringify(registrationJSON);

  var xhr = new XMLHttpRequest();
  xhr.open("POST", "http://10.3.4.30:8083/rest/application/register", false);
  xhr.setRequestHeader("Content-Type", "Application/json;charset=UTF-8");
  xhr.send(registrationJSONStr);

  var response = JSON.parse(xhr.responseText);
  console.log(response);