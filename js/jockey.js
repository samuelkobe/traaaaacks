
var VERSION = 'v1.0';
var IS_DEBUG = false;

/**
 * Options for the RealTime loader.
 */
var realTimeOptions = {
  /**
   * Client ID from the API console.
   */
   // Production Jockey-Player Client Id
   clientId: "470743367704-vmhe2haho8smjdq5uo86g74kpugrr5ig.apps.googleusercontent.com",

   // OLD traaaaacks Client ID
   //clientId: "597181394454-242qbcjc2ch77rmtaoks67gb57vnt8a2.apps.googleusercontent.com",

   //Local Client Id
   //clientId: "470743367704-gt0rb9m8d077bmfd256pt8e5tjcgepki.apps.googleusercontent.com",

  /**
   * Application ID from the API console.
   */

   //Old Traaacks
   // appId: 597181394454,

   //New Jockey-Player Production
   appId: 470743367704,

  /**
   * Function to be called when a RealTime model is first created.
   */
  initializeModel: initializeModel,

  /**
   * Function to be called every time a RealTime file is loaded.
   */
  onFileLoaded: onFileLoaded,

  /**
   * ID of the auth button.
   */
  authButtonElementId: 'authorizeButton',
  /**
   * Automatically create file after auth.
   */
  autoCreate: true,

  /**
   * Name of new files that gets created.
   */
  defaultTitle: 'Jockey'
};

function showShareDialog() {
  var shareClient = new gapi.drive.share.ShareClient(realTimeOptions.appId);
  shareClient.setItemIds(rtclient.params['fileId']);
  shareClient.showSettingsDialog();
}

function startJockey() {
  logDebug('Starting Jockey');
  var realTimeLoader = new rtclient.RealtimeLoader(realTimeOptions);
  realTimeLoader.start();
  // realTimeLoader.start(function(){document.getElementById("loading").style.display = ''});
}

var collabDoc;

var PLAYLIST = 'playlist';
var playlist;
var GLOBAL_USER_NAME;


/**
 * This function is called the first time that the RealTime model is created
 * for a file. This function should be used to initialize any values of the
 * model. In this case, we just create the single string model that will be
 * used to control our text box. The string has a starting value of 'Hello
 * RealTime World!', and is named 'text'.
 * @param model {gapi.drive.realtime.Model} the RealTime root model object.
 */
 
function initializeModel(model) {
  logDebug('initializeModel');
  // model.getRoot().set(MOVES_KEY, model.createList());

  model.getRoot().set(PLAYLIST, model.createList());
}

function updateForRealTimeDoneInitializing() {
  document.getElementById('collaborators').style.display = 'block';
}

/**
 * This function is called when the RealTime file has been loaded. It should
 * be used to initialize any user interface components and event handlers
 * depending on the RealTime model. In this case, create a text control binder
 * and bind it to our string model that we created in initializeModel.
 * @param doc {gapi.drive.realtime.Document} the RealTime document.
 */
function onFileLoaded(doc) {
  logDebug('onFileLoaded');
  collabDoc = doc;
  doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_JOINED, onCollaboratorsChanged);
  doc.addEventListener(gapi.drive.realtime.EventType.COLLABORATOR_LEFT, onCollaboratorsChanged);
  setTimeout(function() {
    updateForRealTimeDoneInitializing();
    setTimeout(function() {
      updateCollaborators();
    }.bind(this), 0);
  }.bind(this), 0);
  var model = doc.getModel();
  playlist = model.getRoot().get(PLAYLIST);
  playlist.addEventListener(gapi.drive.realtime.EventType.VALUES_ADDED, addedToPlaylist);
  playlist.addEventListener(gapi.drive.realtime.EventType.VALUES_REMOVED, removedFromPlaylist);
  generatePlaylistItems();
  setTimeout(addFirstSongToPlaylist, 500);
}

function checkPlaying() {
    var playingUrl = $('.sc-player li.active a').attr("href");
    // add class playing to playlist item
    $("#playlist li").each(function() {
      var thisTrack = $(this);
      var listUrl = $(thisTrack).find("p:first").text();
      if (listUrl == playingUrl) {
        thisTrack.addClass("playing");
      } else {
        thisTrack.removeClass("playing");
      }
    });
    for(var i = 0; i < playlist.length; i++) {
      var tempPlaylist = playlist.get(i);
      if (playlist.get(i)[0] == playingUrl) {
        tempPlaylist[4] = true;
      } else {
        tempPlaylist[4] = false;
      }
      playlist.set(i, tempPlaylist);
    }
}

function finishPlaying() {
    var playingUrl = $('.sc-player li.active a').attr("href");
    $("#playlist li").each(function() {
      var thisTrack = $(this);
      var listUrl = $(thisTrack).find("p:first").text();
      if (listUrl == playingUrl) {
        thisTrack.addClass("finished");
      }
    });
    for(var i = 0; i < playlist.length; i++) {
      var tempPlaylist = playlist.get(i);
      if (playlist.get(i)[4] == true) {
        tempPlaylist[7] = true;
        playlist.set(i, tempPlaylist);
      }
    }
}

function changeScore(newScore) {
    for(var i = 0; i < playlist.length; i++) {
      if (playlist.get(i)[4] == true) {
        var tempPlaylist = playlist.get(i);
        tempPlaylist[5] = newScore;
        playlist.set(i, tempPlaylist);
        updateScore(playlist.get(i)[6]);
      }
    }
}

function generatePlaylistItems() {
    $('#playlist').empty();
    for(var i = 0; i < playlist.length; i++) {
      // get the track image
      var img = document.createElement('img');
      img.src = playlist.get(i)[1]; 
      // get the track information
      var info = document.createElement('div');
      info.className = "track-info";
      var artistName = document.createElement('h1');
      artistName.innerText = playlist.get(i)[2]
      var trackName = document.createElement('h2');
      trackName.innerText = playlist.get(i)[3]
      info.appendChild(artistName);
      info.appendChild(trackName);
      // get the url
      var trackUrl = document.createElement('p');
      trackUrl.innerText = playlist.get(i)[0]
      // get the score
      var rating = document.createElement('div');
      rating.className = "rating";
      rating.innerText = playlist.get(i)[5];

      var pts = document.createElement('span');
      pts.innerText = " /10";
      rating.appendChild(pts);

      //create the result
      var result = document.createElement('li');
      result.appendChild(img);
      result.appendChild(info);
      result.appendChild(trackUrl);
      result.appendChild(rating);
      if (playlist.get(i)[4]) {
          result.className = "playing";
      }
      if (playlist.get(i)[7]) {
          result.className = "finished";
      }
      $('#playlist').append(result);
    }
}

function addedToPlaylist(e) {
    generatePlaylistItems();
}

function removedFromPlaylist(e) {

}

function onCollaboratorsChanged(e) {
  updateCollaborators();
}

function updateCollaborators() {
  logDebug('****updateCollaborators***');
  removeAbsentCollaborators();
  addPresentCollaborators();
}

function removeAbsentCollaborators() {
  // If there is a 'current' DOM session ID in the  that is not present in the
  // updated collaborators list, remove it.
  var updatedCollaborators = collabDoc.getCollaborators();
  var currentDomSessionIds = getCurrentCollaboratorSessionIdsByDom();
  for (var i = 0; i < currentDomSessionIds.length; i++) {
    var domSessionId = currentDomSessionIds[i];
    var found = false;
    for (var j = 0; i < updatedCollaborators.length; j++) {
      var updatedCollaborator = updatedCollaborators[j];
      if (domSessionId == updatedCollaborator.sessionId) {
        // Found, do not remove
        found = true;
        break;
      }
    }

    // Not found, remove from dom.
    if (!found) {
      removeCollaboratorBySessionId(domSessionId);
    }
  }
}

function addPresentCollaborators() {
  var newCollaborators = collabDoc.getCollaborators();
  for (var i = 0; i < newCollaborators.length; i++) {
    maybeAddCollaborator(newCollaborators[i]);
  }
  setTimeout(fadeInAllCollaborators, 0);
}

function fadeInAllCollaborators() {
  var collaborators = collabDoc.getCollaborators();
  for (var i = 0; i < collaborators.length; i++) {
    var collaboratorDiv = getCollaboratorDiv(collaborators[i]);
    collaboratorDiv.className += ' collaborator-shown';
  }
}

function maybeAddCollaborator(collaborator) {
  if (!collaboratorExists(collaborator)) {
    getCollaboratorsContainerDiv().appendChild(genCollaboratorDiv(collaborator));
  }
}

function maybeRemoveCollaborator(collaborator) {
  if (collaboratorExists(collaborator)) {
    getCollaboratorsContainerDiv().removeChild(getCollaboratorDiv(collaborator));
  }
}

function removeCollaboratorBySessionId(sessionId) {
  var divToRemove = getCollaboratorDivBySessionId(sessionId);
  getCollaboratorsContainerDiv().removeChild(divToRemove);
}

function getCurrentCollaboratorSessionIdsByDom() {
  var collaboratorChildren = getCollaboratorsContainerDiv().children;
  var sessionIds = [];
  for (var i = 0; i < collaboratorChildren.length; i++) {
    sessionIds.push(getSessionIdFromCollaboratorDiv(collaboratorChildren[i]));
  }
  return sessionIds;
}

function getSessionIdFromCollaboratorDiv(collaboratorDiv) {
  return collaboratorDiv.id.substring(collaboratorDiv.id.indexOf('_') + 1);
}

function calculateUserScore(username) {
  var score = 0;
  if (playlist.length > 0) {
      for (var i = 0; i < playlist.length; i++) {
        if (playlist.get(i)[6] == username) {
          score += playlist.get(i)[5];
        }
      }
  }
  return score;
}

function updateScore(name) {
  $(".collaborator").each(function() {
    var personName = $(this).find("h1:first").text();
    if (personName == name) {
      $(this).children(".score").text(calculateUserScore(name));
      var pts = document.createElement('span');
      pts.innerText = " pts";
      $(this).children(".score").append(pts);
    }
  });
}

function genCollaboratorDiv(collaborator) {
  var collaboratorDiv = document.createElement('div');
  collaboratorDiv.id = getIdForCollaboratorDiv(collaborator);
  collaboratorDiv.setAttribute('class', 'collaborator');

  var collaboratorName = document.createElement('h1');
  collaboratorName.innerText = collaborator.displayName;

  var imgDiv = document.createElement('img');
  imgDiv.setAttribute('class', 'collaborator-image shadow');
  imgDiv.setAttribute('title', collaborator.displayName);
  imgDiv.setAttribute('alt', collaborator.displayName);
  imgDiv.setAttribute('src', collaborator.photoUrl);

  var score = document.createElement('div');
  score.className = "score";
  score.innerText = calculateUserScore(collaborator.displayName);

  var pts = document.createElement('span');
  pts.innerText = " pts";
  score.appendChild(pts);

  collaboratorDiv.appendChild(collaboratorName);
  collaboratorDiv.appendChild(imgDiv);
  collaboratorDiv.appendChild(score);

  GLOBAL_USER_NAME = collaborator.displayName;

  return collaboratorDiv;
}

function getCollaboratorsContainerDiv() {
  return document.getElementById('collaborators-container');
}

function collaboratorExists(collaborator) {
  return !!getCollaboratorDiv(collaborator);
}

function getCollaboratorDiv(collaborator) {
  return getCollaboratorDivBySessionId(collaborator.sessionId);
}

function getCollaboratorDivBySessionId(sessionId) {
  return document.getElementById(getIdForCollaboratorDivBySessionId(sessionId));
}

function getIdForCollaboratorDiv(collaborator) {
 return getIdForCollaboratorDivBySessionId(collaborator.sessionId);
}

function getIdForCollaboratorDivBySessionId(sessionId) {
 return 'collaborator_' + sessionId;
}

function logDebug(msg) {
  if (IS_DEBUG) {
    window.console.debug(msg);
  }
}

function addSong(i) {
  var url = playlist.get(i)[0];
  if ($("#player-container").hasClass("uninitialized")) {
    $('<a />').attr({ href: url }).appendTo($('div.sc-player'));
    creatingSoundCloudPlayer();
    $("div.sc-player").removeClass("uninitialized");
    $("#player-container").removeClass("uninitialized");
  } else {
    var $myPlayer=$("#player-container .sc-player");//Top player
    $.scPlayer.loadTrackUrlAndWait($myPlayer,url);
  }
}

function addFirstSongToPlaylist() {
  if (playlist.length > 0) {
      for (var i = 0; i < playlist.length; i++) {
        if (!playlist.get(i)[7]) {
          setTimeout(addSong(i), 500);
        }
      }
  }
}

function closeMenu() {
  $('#songSearch').removeClass('open');
  $('#search-results-container').removeClass('visible');
  $('#playlist-container .list-container').animate({
    scrollTop: $("#playlist li:last-child").offset().top
  }, 500);
}

function GetCookie(name) {
  var arg=name+"=";
  var alen=arg.length;
  var clen=document.cookie.length;
  var i=0;
  while (i<clen) {
    var j=i+alen;
    if (document.cookie.substring(i,j)==arg)
    return "here";
    i=document.cookie.indexOf(" ",i)+1;
    if (i==0) 
    break;
  }
  return null;
}

$(function() {

  var visit=GetCookie("COOKIE1");

  if (visit==null){
      $('#add-song-prompt').addClass("visible");
      $('#add-person-prompt').addClass("visible");
  } else {
    $('#add-song-prompt').remove();
    $('#add-person-prompt').remove();
  }

  var expire=new Date();
  expire=new Date(expire.getTime()+7776000000);
  document.cookie="COOKIE1=here; expires="+expire;

  $('body').on('click', '#search-results li', function() {
      $(this).addClass('duplicate');
      var url = $(this).find("p:first").text();
      var img = $(this).find("img:first").attr("src");
      var artist = $(this).find("h1:first").text();
      var title = $(this).find("h2:first").text();
      var playing = false;
      var rating = 0;
      var whoAdded = GLOBAL_USER_NAME;
      var finished = false;

      var song = [url, img, artist, title, playing, rating, whoAdded, finished];
      
      playlist.push(song);
      if ($("#player-container").hasClass("uninitialized") || $('div.sc-player').hasClass("uninitialized")) {
        $("div.sc-player").removeClass("uninitialized");
        $("#player-container").removeClass("uninitialized");
        $('<a />').attr({ href: url }).appendTo($('div.sc-player'));
        creatingSoundCloudPlayer();
      } else {
        // just add a song to the existing scPlayer
            var $myPlayer=$("#player-container .sc-player");//Top player
            $.scPlayer.loadTrackUrlAndWait($myPlayer,url);
      }
    closeMenu();
  });
});