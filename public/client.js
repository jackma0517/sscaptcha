
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
        ajaxPost('http://localhost:8080' + '/submit', {name: username});
    })
  }