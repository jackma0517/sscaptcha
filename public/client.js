

//called after all HTML/CSS/Scripts/DOM are loaded
window.onload = function () {
    var submit = document.getElementById('poke').addEventListener('click', function(){
        socket.emit('message', 'Hi server, how are you?');
    })
  }