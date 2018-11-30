/*
 * Global Variable to store Mouse Movements
 */
var mouseMovementArray = [];
var mouseClicksArray = [];
var ID = "";
// var url = 'http://localhost:8080'; //local
var url = 'https://sscaptcha.herokuapp.com'; //deployed
var img = null; //document.getElementById('captcha-image');
var startTime;

var recorder = {
    
    moveListener:function() {
      var that = this;
      $(window).mousemove(function(e) {
        if(that.state == 1) {
            //hardcoding value to be within the captcha image
            let x = e.clientX - img.offsetLeft;
            let y = e.clientY - img.offsetTop;
            if((x > 0 && x < 800) && (y > 0 && y < 500)){
                that.frames.push([e.clientX, e.clientY]);
                mouseMovementArray.push([x, y]);   
            }
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

recorder.state = 1; //1 = Recording | 2 = Stopped
recorder.frames = [];


/*
 * AJAX Post Request
 */
function ajaxPost(url, data, onSuccess, onError) {
    var xhttp = new XMLHttpRequest();
    var payload = JSON.stringify(data);
  
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
  
    xhttp.onload = function() {
      var status = xhttp.status;
      if (status == 200) { /* Success */
        if(onSuccess){
          onSuccess(xhttp.responseText);
        }
      } else if (status.toString().charAt(0) == 4 || status.toString().charAt(0) == 5) {
        /* Client or network error */
        console.log("POST failure");
        if(onError){
          onError();
        }
      }  
    }
    xhttp.send(payload);
  }

  /*
 * AJAX Get Request
 */
function ajaxGet(url) {
    var xhttp = new XMLHttpRequest();
  
    xhttp.open('GET', url, true);
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
  
    xhttp.onload = function() {
      var status = xhttp.status;
      if (status == 200) { /* Success */
        var payload = JSON.parse(xhttp.responseText)
        document.getElementById('captcha-image').setAttribute(
          'src', payload[0]
        );

        //Format instructions
        var instruction_header = document.createElement("h4");
        instruction_header.innerHTML = "Instructions";
        var instruction_box = document.getElementById('instruction-textbox');
        //remove old instructions
        instruction_box.textContent = "";
        instruction_box.append(instruction_header);

        var instrStr = payload[1].toString();
        var count = 0;
        var step = 1;
        for(var i = 0; i<instrStr.length; i++){
          if(instrStr[i] == "," || i == instrStr.length-1){
            if(i == instrStr.length -1 ){
              var temp = step + ". " + instrStr.substring(count, i+1);
            }else {
              var temp = step + ". " + instrStr.substring(count, i);
            }
            count = i+1;
            step = step+1;
            var newLine = document.createElement("br");
            instruction_box.append(temp);
            instruction_box.append(newLine);
          }
        }
        var clickSubmitInstruction = document.createElement("b");
        clickSubmitInstruction.innerHTML = step +". Click 'Sumbit Captcha' Button";
        instruction_box.append(clickSubmitInstruction);

        ID = payload[2];

      } else if (status.toString().charAt(0) == 4 || status.toString().charAt(0) == 5) {
        /* Client or network error */
      }  
    }
    xhttp.send();
  }

  function showSurvey() {
    var modal = document.getElementById("modal");
    modal.style.display = "flex";


    $(document).keydown(function (e) {
      if (e.keyCode == 27) { //esc button
        $("#modal").hide();
      }
    });

  }

  function hideSurvey() {
    var modal = document.getElementById("modal");
    modal.style.display = "none";
  }

  function postTimeToSheet(totalTime){
    var data = totalTime;
   var urlSheet = 'https://script.google.com/macros/s/AKfycbzofDPtEHwFS8bHjSpmYz5extilLZvssTzqbS2vpEQebYFhjfU/exec';
    console.log("data: " +data);

    $.ajax({
      url: urlSheet,
      type: 'GET',
      dataType: 'json',
      data: {recorded_time: data}
    });
    
  }

//called after all HTML/CSS/Scripts/DOM are loaded
window.onload = function () {
  //get start time
  startTime = performance.now();
  var totalTime = 0;

  /*
  * Listen for the mouse movements
  */
  img = document.getElementById('captcha-image');
  recorder.moveListener();

  //starts recording on load
  recorder.record();
  ajaxGet(url + '/captcha');


  document.getElementById('submit-btn').addEventListener('click', function(){
    if(mouseMovementArray.length == 0){
      alert("Please record mouse movements before submitting captcha");
    } else {
      var data = {
        mouseMovements: mouseMovementArray,
        mouseClicks: mouseClicksArray,
          solutionID: ID
      };
        ajaxPost(url + '/submit', data, function(response){
          if(response == "human"){
            alert("You have been identified as human! \n Please take a moment to complete our survey");

            //get time to complete
            var endTime = performance.now();
            totalTime = endTime - startTime;
            showSurvey();
            console.log(totalTime);
            postTimeToSheet(totalTime);
          } else {
            alert("You have been identified as a bot! \n If this is incorrect please get a new Captcha or complete our survey");
          }
        }, 
        function(){
          alert("Authentication failed please retry captcha");
        });
      }
      mouseMovementArray = [];
      mouseClicksArray = [];
      ID = "";
  })

  document.getElementById('get-captcha').addEventListener('click', function(){
    console.log('Client requesting CAPTCHA');
    ajaxGet(url + '/captcha');
    startTime = performance.now();
  })

  document.getElementById("captcha-image").addEventListener('click', function(e){
    var x = e.pageX - this.offsetLeft;
    var y = e.pageY - this.offsetTop;
    mouseClicksArray.push([x,y]);
  })

  document.getElementById("survey-btn").addEventListener('click', function(){
    showSurvey();
  })
  document.getElementById("survey-close-btn").addEventListener('click', function(){
    hideSurvey();
  })
  document.getElementById("survey-X-btn").addEventListener('click', function(){
    hideSurvey();
  })
}


