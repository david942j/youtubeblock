var Blocker = new function() {
  let api = null
  let YT_PLAY = 1
  return {
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
            _yt_www.Gi().pauseVideo()
            tryUntilNext(curVideoId())
          }
          if(orig) return orig.apply(window, arguments)
        }
      })
      return;
    }
  }

  /* private functions */
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
    if(curVideoId() == skipId) {
      _yt_www.Gi().nextVideo()
      setTimeout(function() { tryUntilNext(skipId) }, 500)
    }
  }

  function searchObject(target) {
    return Object.getOwnPropertyNames(window).find(function (p) {
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
    return true
  }
}

Blocker.work()
