/*
 * Global Variable to store Mouse Movements
 * Sorry this is so unorganized and inconsistent D; it hurts me too
 */
var mouseMovementArray = [];



var recorder = {
    
    moveListener:function() {
      var that = this;

      $(window).mousemove(function(e) {
        if(that.state == 1) {
          that.frames.push([e.clientX, e.clientY]);
        }
      });
    },

    record:function() {
      var that = this;
      that.frames = [];
      that.state = 1;
      that.startTime = new Date().getTime()/1000;
        
      $('button.r').text('recording..');
      $('button.p').text('stop & play');
      
    },

    playback:function() {
      var that = this;
      that.state = 2;
      
      $('button.r').text('record');
      $('button.p').text('playing..');

      that.endTime = new Date().getTime()/1000;
      that.time = (that.endTime - that.startTime) * 3;

      //super hacky and dumb idk
      mouseMovementArray = that.frames;
      console.log(mouseMovementArray);

      $(that.frames).each(function(i, move) {

        setTimeout(function() {
          $('div.cursor').css({
            left: move[0],
            top: move[1]
          });
          
          if(i == that.frames.length-1) {
            $('.p').text('stop & play');
          }

        }, (that.time * i));

      });
    }

};

recorder.state = 2; //1 = Recording | 2 = Stopped
recorder.frames = [];

/*
 * Listen for the mouse movements
 */
recorder.moveListener();





/*
 * AJAX Post Request
 */
function ajaxPost(url, data) {
    var xhttp = new XMLHttpRequest();
    var payload = JSON.stringify(data);
    console.log(payload);
  
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
  
    xhttp.onload = function() {
      var status = xhttp.status;
      if (status == 200) { /* Success */
        console.log("POST success");
        var responseObj = JSON.parse(xhttp.responseText);

        var message = responseObj.boop;
        alert(message);
      } else if (status.toString().charAt(0) == 4 || status.toString().charAt(0) == 5) {
        /* Client or network error */
        console.log("POST failure");
      }  
    }
    xhttp.send(payload);
  }


//called after all HTML/CSS/Scripts/DOM are loaded
window.onload = function () {

    var username = prompt('What\'s your username?');

    document.getElementById('submit-btn').addEventListener('click', function(){
        //socket.emit('message', 'Hi server, how are you?');
        if(mouseMovementArray.length == 0){
            alert("Please record mouse movements before submitting captcha");
        } else {
            var data = {
                name: username, 
                mouseMovements: mouseMovementArray
            };
            ajaxPost('http://localhost:8080' + '/submit', data);
        }
    })
  }