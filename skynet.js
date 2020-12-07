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
const REWARD_LIGHTS_RED = '6b6161cb-8d58-4996-a9be-d85ae77c169e', REWARD_LIGHTS_BLUE = '768c1085-8e0e-47f9-ad26-540b844c85d0',
  REWARD_LIGHTS_GREEN = 'ab01dbb0-aff5-495a-9a9f-9209cf7533c0', REWARD_LIGHTS_PINK = 'fc8fd880-56c8-4a49-831b-132b7882de6a',
  REWARD_LIGHTS_PURPLE = 'a2f3bf4b-dd63-4732-b4eb-fde790fe78ff', REWARD_LIGHTS_WHITE = '8a019f0a-b6d3-4dac-a0a2-967e86c52d53',
  REWARD_LIGHTS_OFF = '6f986e2e-e1b1-4d0b-8496-986091bef7be', REWARD_DAB = 'ae1faa37-fead-4336-bd42-d610eda62ed9';


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
      if(objectValue["event"]=="keyDown"){
        var payloadData = (((objectValue["payload"])["settings"])["id"]);

        switch(payloadData){
          default:
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
      case REWARD_LIGHTS_RED:
        setLightToScene(RED);
        break;
      case REWARD_LIGHTS_BLUE:
        setLightToScene(BLUE);
        break;
      case REWARD_LIGHTS_GREEN:
        setLightToScene(GREEN);
        break;
      case REWARD_LIGHTS_PINK:
        setLightToScene(PINK);
        break;
      case REWARD_LIGHTS_PURPLE:
        setLightToScene(PURPLE);
        break;
      case REWARD_LIGHTS_WHITE:
        setLightToScene(WHITE);
        break
      case REWARD_LIGHTS_OFF:
        turnOffLights();
        break;
      case REWARD_DAB:
        switchToDabCamera();
        break

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

function debugHue() {//used as a debug function to get hue scenes
  client.scenes.getAll()
    .then(scenes => {
      for (let scene of scenes) {
        console.log(`Scene [${scene.id}]: ${scene.name}`);
        console.log('  Lights:', scene.lightIds.join(', '));
        console.log();
      }
    });
}

async function toggleReward() {
  await apiClient.helix.users.getUserByName("sr2610")
  .then(user => {
    apiClient.helix.channelPoints.getCustomRewardById(user.id, REWARD_DAB)
    .then(reward => {
      apiClient.helix.channelPoints.updateCustomReward(user.id,REWARD_DAB, {isPaused:!reward.isPaused});
    }).catch();
  }).catch();

  return;
}

/*
async function createReward(){
    await apiClient.helix.users.getUserByName("sr2610")
  .then(user => {
    apiClient.helix.channelPoints.createCustomReward(user.id,{
      cost:100,
      title:"Test Reward"
      })
    .then(reward => {
      console.log(reward.id);
    }).catch();
  }).catch();
}*/