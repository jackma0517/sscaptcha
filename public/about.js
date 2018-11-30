//var url = 'http://localhost:8080'; //local
var url = 'https://sscaptcha.herokuapp.com'; //deployed

function showSurvey() {
    var modal = document.getElementById("modal");
    modal.style.display = "block";


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

    document.getElementById('get-captcha').addEventListener('click', function(){
      window.location=url;
    })
    document.getElementById("about-btn").addEventListener('click', function(){
      window.location = url + "/about.html";
    })
    document.getElementById("survey-btn").addEventListener('click', function(){
      showSurvey();
    })
    document.getElementById("survey-close-btn").addEventListener('click', function(){
      hideSurvey();
    })
  }