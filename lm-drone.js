var Cylon = require('cylon');

// constantes de movimento horizontal
var DIRECTION_THRESHOLD = 0.25;
var DIRECTION_SPEED_FACTOR = 10;

// constantes e variaveis de movimento vertical
var VERTICAL_THRESHOLD = 50;
var VERTICAL_SPEED_FACTOR = 0.01;
var last_hand_close = false; // flag para detectar a altura da palma na "abertura da mão"
var startPalmHeight = 0.0;

// constantes de Take off e Landing
var CIRCLE_THRESHOLD = 1.0;

function directionSpeed(value){
	return (Math.abs(value) - DIRECTION_THRESHOLD)*DIRECTION_SPEED_FACTOR;
}

function verticalSpeed(value){
  return (Math.abs(value) - VERTICAL_THRESHOLD)*VERTICAL_SPEED_FACTOR;
}

Cylon.robot({

  connections: [
  	{ name: 'leapmotion', adaptor: 'leapmotion', port: '127.0.0.1:6437' },
    { name: 'ardrone', adaptor: 'ardrone', port: '192.168.1.1' },
    { name: 'keyboard', adaptor: 'keyboard' }
  ],

  devices: [
    { name: 'drone', driver: 'ardrone', connection:'ardrone' },
    {name: 'leapmotion', driver: 'leapmotion', connection:'leapmotion' },
    {name: 'keyboard', driver: 'keyboard', connection:'keyboard'},
  ],

 work: function(my) {
    //console.log(my.drone.toString());

/*
    my.drone.takeoff();
    after((10).seconds(), my.drone.land);
    after((15).seconds(), my.drone.stop);
*/
    my.leapmotion.on('connect', function() {
      console.log("Connected to Leap Motion.");
    });

    my.leapmotion.on('start', function() {
      console.log("Leap Motion has started.");
    });

    my.leapmotion.on('frame', function(frame) {
      //console.log(frame.toString());
    });


    // HAND
    my.leapmotion.on('hand', function(hand) {

      // console.log("sf: " + hand._scaleFactor + " grab: " + hand.grabStrength + " pintch: " + hand.pinchStrength);
      //console.log(hand.grabStrength);

      // Variaveis de controle do Drone:
      var left_right_index = -1.0*hand.palmNormal[0]; // inclinar a palma da mão para a esquerda é mandar o drone para a direita
      var front_back_index = -1.0*hand.palmNormal[2]; // inclinar a palma da mão para a frente é mandar o drone para trás
      var hand_close = (hand.grabStrength != 0.0);
      var up_down_index = startPalmHeight-hand.palmPosition[1];
      //var grab_read_commands = (hand.grabStrength == 0.0);
      //console.log(hand.grabStrength + " -> " + hand_close);

      //console.log(hand._scaleFactor);

      if (hand_close) {
      	console.log("my.drone.stop()");
        my.drone.stop();
        startPalmHeight = hand.palmPosition[1];
      } else {

      	// Left -> Right Threshold
      	if (directionSpeed(left_right_index)>0) {
      		if (left_right_index<=0){
      			console.log("my.drone.left("+directionSpeed(left_right_index)+")");
            my.drone.left(directionSpeed(left_right_index));
      		} else {
      			console.log("my.drone.right("+directionSpeed(left_right_index)+")");
            my.drone.right(directionSpeed(left_right_index));
      		}
      	};

      	// Front -> Back Threshold
      	if (directionSpeed(front_back_index)>0) {
      		if (front_back_index<=0){
      			console.log("my.drone.front("+directionSpeed(front_back_index)+")");
            my.drone.front(directionSpeed(front_back_index));
      		} else {
      			console.log("my.drone.back("+directionSpeed(front_back_index)+")");
            my.drone.back(directionSpeed(front_back_index));
      		}
      	};


        // up -> down Threshold and Speed
        if (verticalSpeed(up_down_index)>0){
          if (up_down_index<=0) {
            console.log("my.drone.up("+verticalSpeed(up_down_index)+")");
            my.drone.up(verticalSpeed(up_down_index));
          } else {
            console.log("my.drone.down("+verticalSpeed(up_down_index)+")");
            my.drone.down(verticalSpeed(up_down_index));
          }
        };

        // auto stop
        if (verticalSpeed(up_down_index)<=0 &&
            directionSpeed(left_right_index)<=0 &&
            directionSpeed(front_back_index)<=0)
        {
          console.log("my.drone.stop()");
          my.drone.stop();
        }

      }; // else comandos


       // detecta a abetura da mão uma vez para pegar o "v0" da altura da mao
	     if (!hand_close && last_hand_close) {
	       console.log("hand open! h="+ hand.palmPosition[1]);
         startPalmHeight = hand.palmPosition[1];
	     }

	     last_hand_close = hand_close;

	   }); // "lm.on.hand"

    // GESTOS
    my.leapmotion.on('gesture', function(gesture) {

      // start/stop -> Circle
      if (gesture.type=='circle' && gesture.progress > CIRCLE_THRESHOLD ){

          // Clockwise -> TakeOff
          if (gesture.normal[2] < 0) {
            console.log('my.drone.takeoff()');
            my.drone.takeoff();
            my.drone.stop();
          };

          // Counter-Clockwise -> Land()
          if (gesture.normal[2] > 0) {
            console.log('my.drone.land()');
            my.drone.stop();
            my.drone.land();
          }
        }

    });

    // EMERGENCE KEYS
    my.keyboard.on('s', function(key) {
        console.log("my.drone.stop()");
        my.drone.stop();
    });

    my.keyboard.on('l', function(key) {
        console.log("my.drone.land()");
        my.drone.land();
    });

    my.keyboard.on('t', function(key){
        console.log("my.drone.takeoff()");
        my.drone.takeoff();
    });

    my.keyboard.on('u', function(key){
        console.log("my.drone connection test");
        my.drone.takeoff();

      after((10).seconds(), function() {
        my.drone.land();
      });

      after((15).seconds(), function() {
        my.drone.stop();
      });
    }) ;
	}

}).start();