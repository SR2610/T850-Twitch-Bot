var ComfyJS = require("comfy.js");

let huejay = require('huejay');

const OBSWebSocket = require('obs-websocket-js');


const obs = new OBSWebSocket();


let client = new huejay.Client({
  host: '192.168.1.225',
  port: 80,               // Optional
  username: 'zjTQgHyGrICuXIFx3ANljgQkVVnQlvO9ZlQCPJ9d', // Optional
  timeout: 15000,            // Optional, timeout in milliseconds (15000 is the default)
});

//LIGHTS
const GROUP_ID = 9, RED = 'GgVtnAjJXCzxZyy', BLUE = 'jbtuQnGc7sIYznl', GREEN = 'BAyhtEu6aSNvqKj', PINK = 'lEdhmxQVq9WKdRj', PURPLE = 'c4F8p8eB4CSgEXc', WHITE = 'DLa-2W2ecctaccs';

//REWARD IDS
const REWARD_LIGHTS_RED = '6b6161cb-8d58-4996-a9be-d85ae77c169e', REWARD_LIGHTS_BLUE = '768c1085-8e0e-47f9-ad26-540b844c85d0',
  REWARD_LIGHTS_GREEN = 'ab01dbb0-aff5-495a-9a9f-9209cf7533c0', REWARD_LIGHTS_PINK = 'fc8fd880-56c8-4a49-831b-132b7882de6a',
  REWARD_LIGHTS_PURPLE = 'a2f3bf4b-dd63-4732-b4eb-fde790fe78ff', REWARD_LIGHTS_WHITE = '8a019f0a-b6d3-4dac-a0a2-967e86c52d53',
  REWARD_LIGHTS_OFF = '6f986e2e-e1b1-4d0b-8496-986091bef7be', REWARD_DAB = '8488c296-5eee-40a2-a4eb-eefec9a3d5c8';;

huejay.discover()
  .then(bridges => {
    for (let bridge of bridges) {
      console.log(`Id: ${bridge.id}, IP: ${bridge.ip}`);
    }
  })
  .catch(error => {
    console.log(`An error occurred: ${error.message}`);
  });



obs.connect({
  address: 'localhost:4444',
  password: '$up3rSecretP@ssw0rd'
})
  .then(() => {
    console.log(`Success! We're connected & authenticated.`);
  
  })
  .catch(err => { // Promise convention dicates you have a catch on every chain.
    console.log(err);
  });


// You must add this handler to avoid uncaught exceptions.
obs.on('error', err => {
  console.error('socket error:', err);
});

ComfyJS.onChat = (user, message, flags, self, extra) => {

  if (flags.customReward) {
    console.log("Reward Redeemed");
    switch (extra.customRewardId) {
      case REWARD_LIGHTS_RED:
        SetLightToScene(RED);
        break;
      case REWARD_LIGHTS_BLUE:
        SetLightToScene(BLUE);
        break;
      case REWARD_LIGHTS_GREEN:
        SetLightToScene(GREEN);
        break;
      case REWARD_LIGHTS_PINK:
        SetLightToScene(PINK);
        break;
      case REWARD_LIGHTS_PURPLE:
        SetLightToScene(PURPLE);
        break;
      case REWARD_LIGHTS_WHITE:
        SetLightToScene(WHITE);
        break
      case REWARD_LIGHTS_OFF:
        TurnOffLights();
        break;
      case REWARD_DAB:
        console.log("DAB");
        DabCamera();
        break

    }

  }
}

ComfyJS.Init("SR2610");

/*client.scenes.getAll()
  .then(scenes => {
    for (let scene of scenes) {
      console.log(`Scene [${scene.id}]: ${scene.name}`);
      console.log('  Lights:', scene.lightIds.join(', '));
      console.log();
    }
  });*/



function SetLightToScene(scene) {
  client.groups.getById(GROUP_ID)
    .then(group => {


      group.on = true;
      group.scene = scene;

      return client.groups.save(group);
    })
    .then(group => {
      console.log(`Group [${group.id}] was saved`);
    })
    .catch(error => {
      console.log(error.stack);
    });

}

function TurnOffLights() {
  client.groups.getById(GROUP_ID)
    .then(group => {


      group.on = false;

      return client.groups.save(group);
    })
    .then(group => {
      console.log(`Group [${group.id}] was saved`);
    })
    .catch(error => {
      console.log(error.stack);
    });

}




function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function DabCamera() {
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

