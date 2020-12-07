require('dotenv').config();

let huejay = require('huejay');

const OBSWebSocket = require('obs-websocket-js');
const obs = new OBSWebSocket();

const { ApiClient } = require('twitch');
const { StaticAuthProvider } = require('twitch-auth');
const { PubSubClient } = require('twitch-pubsub-client');
const WebSocket = require('ws')



const clientId = process.env.TWITCH_CLIENT_ID;
const accessToken = process.env.TWITCH_KEY;
const authProvider = new StaticAuthProvider(clientId, accessToken);
const apiClient = new ApiClient({ authProvider });

const pubSubClient = new PubSubClient();

const wss = new WebSocket.Server({ port: 8080 })


var userId;
var client;


//LIGHTS
const GROUP_ID = 9, RED = 'GgVtnAjJXCzxZyy', BLUE = 'jbtuQnGc7sIYznl', GREEN = 'BAyhtEu6aSNvqKj', PINK = 'lEdhmxQVq9WKdRj', PURPLE = 'c4F8p8eB4CSgEXc', WHITE = 'DLa-2W2ecctaccs';

//REWARD IDS
const REWARDS = {
  RED: 'd70e714c-fb41-469c-89f7-deb500f93ce7',
  BLUE: '2e6eb414-5dc6-4c7f-a363-7064d7ebd50a',
  GREEN: '7c0da6e9-8648-4dba-b5fe-b18a28c0643b',
  PURPLE: '1774c5dc-243b-4cba-8ce6-97d8d256ac57',
  WHITE: 'b2e45da1-294d-4463-b5f9-c77ebe197707',
  OFF: '9afdeaf9-c6b2-4910-be90-976b1b66c103',
  DAB: 'ae1faa37-fead-4336-bd42-d610eda62ed9'
}

init();

function init() {

  userId = registerListener().then(() => { getListener(); });
  client = new huejay.Client({
    host: process.env.HUE_IP,
    port: 80,
    username: process.env.HUE_USER,
    timeout: 15000,
  });


  huejay.discover()
    .then(bridges => {
      for (let bridge of bridges) {
        console.log(`Hue Bridge Discovered: ID: ${bridge.id}, IP: ${bridge.ip}`);
      }
    })
    .catch(error => {
      console.log(`An error occurred when finding hue bridges: ${error.message}`);
    });

  obs.connect({
    address: process.env.OBS_IP,
    password: process.env.OBS_PASSWORD
  })
    .then(() => {
      console.log(`Connected and Authenticated with OBS!`);

    })
    .catch(err => {
      console.log("Unable to connect with OBS-Websocket.  Ensure that OBS is running first!")
      //console.log(err); //Don't always need error logged.  It is usually just obs not running that causes it.
    });


  obs.on('error', err => { //Catch other obs websocket errors
    console.error('socket error:', err);
  });

  wss.on('connection', (ws) => {
    ws.on('message', (message) => {
      var objectValue = JSON.parse(message);
      if (objectValue["event"] == "keyDown") {
        var payloadData = (((objectValue["payload"])["settings"])["id"]);
        switch (payloadData) {
          case "toggleAllRewards":
            toggleAllRewards();
            break;
          case "enableAllRewards":
            enableDisableAllRewards(true);
            break;
          case "disableAllRewards":
            enableDisableAllRewards(false);
            break;
            default:
              console.log(payloadData);
              break;
        }

      }
    })
  })



}

async function registerListener() {
  return await pubSubClient.registerUserListener(apiClient);
}


async function getListener() {
  return await pubSubClient.onRedemption(await pubSubClient.registerUserListener(apiClient), (message) => {
    switch (message.rewardId) {
      case REWARDS.RED:
        setLightToScene(RED);
        break;
      case REWARDS.BLUE:
        setLightToScene(BLUE);
        break;
      case REWARDS.GREEN:
        setLightToScene(GREEN);
        break;
      case REWARDS.PURPLE:
        setLightToScene(PURPLE);
        break;
      case REWARDS.WHITE:
        setLightToScene(WHITE);
        break
      case REWARDS.OFF:
        turnOffLights();
        break;
      case REWARDS.DAB:
        switchToDabCamera();
        break;

    }
  });
}


function setLightToScene(sceneID) {
  client.groups.getById(GROUP_ID)
    .then(group => {


      group.on = true;
      group.scene = sceneID;

      return client.groups.save(group);
    })
    .then(group => {
      //console.log(`Group [${group.id}] was saved`);
    })
    .catch(error => {
      console.log(error.stack);
    });

}

function turnOffLights() {
  client.groups.getById(GROUP_ID)
    .then(group => {


      group.on = false;

      return client.groups.save(group);
    })
    .then(group => {
      // console.log(`Group [${group.id}] was saved`);
    })
    .catch(error => {
      console.log(error.stack);
    });

}




function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function switchToDabCamera() {
  var sceneName = obs.send('GetCurrentScene');
  obs.send('SetCurrentScene', {
    'scene-name': 'DabCamera'
  });
  await sleep(4000)
  console.log((await sceneName).name);
  obs.send('SetCurrentScene', {
    'scene-name': (await sceneName).name
  });
}




function toggleAllRewards() {
  for (let item in REWARDS) {
    setRewardEnabled(REWARDS[item], true, false);
  }
}

function enableDisableAllRewards(doEnable) {
  for (let item in REWARDS) {
    setRewardEnabled(REWARDS[item], false, doEnable);
  }
}





async function setRewardEnabled(rewardID, toggleReward, enabled) {
  await apiClient.helix.users.getUserByName(process.env.TWITCH_USER).then(user => {
    apiClient.helix.channelPoints.getCustomRewardById(user.id, rewardID).then(reward => {
      var rewardPaused;
      if (toggleReward) {
        rewardPaused = !reward.isPaused;
      }
      else
        rewardPaused = !enabled;

      apiClient.helix.channelPoints.updateCustomReward(user.id, rewardID, { isPaused: rewardPaused });

    }).catch();
  }).catch();

}


/*async function createReward(){
    await apiClient.helix.users.getUserByName(process.env.TWITCH_USER)
  .then(user => {
    apiClient.helix.channelPoints.createCustomReward(user.id,{
      cost:300,
      title:"Lights Out!"
      })
    .then(reward => {
      console.log(reward.id);
    }).catch();
  }).catch();
}*/
/*
function debugHue() {//used as a debug function to get hue scenes
  client.scenes.getAll()
    .then(scenes => {
      for (let scene of scenes) {
        console.log(`Scene [${scene.id}]: ${scene.name}`);
        console.log('  Lights:', scene.lightIds.join(', '));
        console.log();
      }
    });
}*/