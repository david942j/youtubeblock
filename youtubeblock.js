var Blocker = new function() {
  let thisObj
  let YT_PLAY = 1
  return thisObj = {
    work: function() {
      waitUntilObject(['window'], {
        checker: function(w) {
          return !!searchObject("ytPlayeronStateChangeplayer")
        }
      }, function(w) {
        let name = searchObject("ytPlayeronStateChangeplayer")
        // hook state change
        let orig = window[name]
        window[name] = function(e) {
          if(e == YT_PLAY && needSkip()) {
            api().pauseVideo()
            tryUntilNext(curVideoId())
          }
          if(orig) return orig.apply(window, arguments)
        }
      })
      return;
    }
  }

  /* private functions */
  function api() {
    if(thisObj.api) return thisObj.api
    return thisObj.api = (function(g) {
      let name = Object.getOwnPropertyNames(g).find(function(e) {
        if(! (g[e] && typeof g[e] == 'object' && Object.keys(g[e]).length == 1))
          return false
        return !!searchObject('player_', g[e])
      })
      return g[name][searchObject('player_', g[name])].api
    })(_yt_www)
  }

  function waitUntilObject(attrAry, options, callback) {
    let now = options['root'] || window
    let checker = options['checker'] || function(e) { return typeof now != 'undefined' }
    for(let i = 0; i < attrAry.length; i++) {
      now = now[attrAry[i]]
      if(!checker(now)) {
        return setTimeout(function() { waitUntilObject(attrAry, options, callback) }, 200);
      }
    }
    callback(now)
  }

  function tryUntilNext(skipId) {
    console.log("Skip %s", skipId)
    if(curVideoId() == skipId) {
      api().nextVideo()
      setTimeout(function() { tryUntilNext(skipId) }, 500)
    }
  }

  function searchObject(target, from) {
    return Object.getOwnPropertyNames(from || window).find(function (p) {
      return p.substring(0, target.length) == target
    })
  }

  function needSkip() {
    return blacklist(curVideoId())
  }

  function curVideoId() {
    return ytplayer.config.args.video_id
  }

  function blacklist(videoId) {
    return ['29tEEaTN_Sc'].includes(videoId)
  }
}

Blocker.work()
