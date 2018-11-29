/*
 * Global Variable to store Mouse Movements
 * Sorry this is so unorganized and inconsistent D; it hurts me too
 */
var mouseMovementArray = [];
var mouseClicksArray = [];
var ID = "";
var url = 'http://localhost:5000';

var recorder = {
    
    moveListener:function() {
      var that = this;

      $(window).mousemove(function(e) {
        if(that.state == 1) {
            //hardcoding value to be within the captcha image
            if((e.clientX > 200 && e.clientX < 1000) && (e.clientY > 200 && e.clientY < 700)){
                that.frames.push([e.clientX, e.clientY]);
                mouseMovementArray.push([e.clientX, e.clientY]);   
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
 * Listen for the mouse movements
 */
recorder.moveListener();





/*
 * AJAX Post Request
 */
function ajaxPost(url, data, onSuccess, onError) {
    var xhttp = new XMLHttpRequest();
    var payload = JSON.stringify(data);
    console.log(payload);
  
    xhttp.open('POST', url, true);
    xhttp.setRequestHeader('Content-type', 'application/json;charset=UTF-8');
  
    xhttp.onload = function() {
      var status = xhttp.status;
      if (status == 200) { /* Success */
        console.log("POST success");
        console.log("response: " + xhttp.responseText);
        //var responseObj = JSON.parse(xhttp.responseText);
        if(onSuccess){
          onSuccess(xhttp.responseText);
        }
        //var message = responseObj.boop;
        //alert(message);

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
    console.log('Sending an AJAXGet to: ' + url);
  
    xhttp.onload = function() {
      var status = xhttp.status;
      if (status == 200) { /* Success */
        console.log("GET success");
        var payload = JSON.parse(xhttp.responseText)
        document.getElementById('captcha-image').setAttribute(
          'src', payload[0]
        );

        var instruction_header = document.createElement("h4");
        instruction_header.innerHTML = "Instructions";
        var instruction_box = document.getElementById('instruction-textbox');
        //remove old instructions
        instruction_box.textContent = "";
        instruction_box.append(instruction_header);

        console.log('Instructions');
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
            var newLine = document.createElement("br");
            count = i+1;
            step = step+1;
            instruction_box.append(temp);
            instruction_box.append(newLine);
          }
        }

        console.log('Board GUID for solution ' + payload[2]);
        ID = payload[2];
        //var responseObj = JSON.parse(xhttp.responseText);

        //var message = responseObj.boop;
        //alert(message);
      } else if (status.toString().charAt(0) == 4 || status.toString().charAt(0) == 5) {
        /* Client or network error */
        console.log("GET failure");
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

//called after all HTML/CSS/Scripts/DOM are loaded
window.onload = function () {
  //get start time
  var startTime = performance.now();
  var totalTime = 0;

  //starts recording on load
  recorder.record();
  ajaxGet(url + '/captcha');


  document.getElementById('submit-btn').addEventListener('click', function(){
    if(mouseMovementArray.length == 0){
      alert("Please record mouse movements before submitting captcha");
    } else {
    //playback mouse movements to user for better usability?
      //recorder.playback();
      var data = {
        mouseMovements: mouseMovementArray,
        mouseClicks: mouseClicksArray,
          solutionID: ID
      };
      console.log(mouseClicksArray);
        ajaxPost(url + '/submit', data, function(response){
          if(response == "human"){
            alert("You have been identified as human! \n Please take a moment to complete our survey");
            //window.location = url + '/success.html';
            //get time to complete
            var endTime = performance.now();
            totalTime = endTime - startTime;
            showSurvey();
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
}

function checkSurveyComplete(){
  if($("input[name=num-attempts]:checked").val() == undefined ||
     $("input[name=solve-time]:checked").val() == undefined ||
     $("input[name=solve-again]:checked").val() == undefined ||
     $("input[name=recognize-shapes]:checked").val() == undefined ||
     $("input[name=ambiguity-level]:checked").val() == undefined ||
     $("input[name=difficulty-level]:checked").val() == undefined ||
     $("input[name=shape-sizes]:checked").val() == undefined ||
     $("input[name=interactive-difficulty]:checked").val() == undefined ||
     $("input[name=text-SS]:checked").val() == undefined ||
     $("input[name=image-SS]:checked").val() == undefined){
      return false;
  } 
  return true;
}

function clearRadioButtonList(){
  var radioButtonList = document.getElementsByTagName('input');
  for (var i = 0; i < radioButtonList.length; i++) {
    var inputElement = radioButtonList[i];
    inputElement.checked = false;
  }
  return false;
}

function searchDOMTree(element, name) {
  while (element.className != name) {
    //search all siblings of element for class name
    element = element.nextSibling;
    if (!element) {
      alert("cannot find element: ", name);
    }
  }
  return element;
}

function submitSurvey(totalTime){

  var surveyResults = {
    recorded_time_ms : totalTime,  
    num_attempts : $("input[name=num-attempts]:checked").val(),
    solve_time : $("input[name=solve-time]:checked").val(),
    solve_again : $("input[name=solve-again]:checked").val(),
    recognize_shapes : $("input[name=recognize-shapes]:checked").val(),
    ambiguity_level : $("input[name=ambiguity-level]:checked").val(),
    difficulty_level : $("input[name=difficulty-level]:checked").val(),
    shape_sizes : $("input[name=shape-sizes]:checked").val(),
    interactive_difficulty : $("input[name=interactive-difficulty]:checked").val(),
    text_SS : $("input[name=text-SS]:checked").val(),
    image_SS: $("input[name=image-SS]:checked").val() 
  };

  var data = {
    surveyResults: surveyResults
  };

  ajaxPost(url + '/submitSurvey', data, function(){
    alert("Thank you for participating :) ");
    clearRadioButtonList();
    hideSurvey();
  }, function(){
    alert("Error Receiving Survey. Please Submit Again");
  });
}
