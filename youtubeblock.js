var Blocker = new function() {
  let thisObj, block = null
  let YT_PLAY = 1
  // to communicate with content script
  let tube = new function() {
    let response = null
    window.addEventListener('message', function(event) {
      if(event.data.type == 'FromContentScript')
        return response && response(event.data.data)
      if(event.data.type == 'FromPopUp') {
        if(event.data.data == 'reload') fetchPolicy()
      }
    })
    return {
      communicate: function(detail, res) {
        document.dispatchEvent(new CustomEvent('FromPageJS', { detail: detail }))
        response = res
      }
    }
  }

  let Block = function(_policy) {
    let policy = _policy || {}
    policy.ids = policy.ids || []
    policy.substr = policy.substr || []
    return {
      isBlock: function(video) {
        return blockId(video.id) || blockTitle(video.title)
      }
    }

    function blockId(videoId) {
      return policy.ids.includes(videoId)
    }

    function blockTitle(title) {
      let ok = true
      for(var i = 0; i < policy.substr.length; i++)
        if(title.indexOf(policy.substr[i]) !== -1) {
          ok = false
          break
        }
      return !ok
    }
  }

  return thisObj = {
    work: function() {
      fetchPolicy()
      // wait for youbube js binding done
      waitUntilObject(['window'], {
        checker: function(w) {
          return !!searchObject("ytPlayeronStateChangeplayer")
        }
      }, function(w) {
        let name = searchObject("ytPlayeronStateChangeplayer")
        // hook state change
        let orig = window[name]
        window[name] = function(e) {
          if(e == YT_PLAY) {
            if(needSkip()) {
              api().pauseVideo()
              tryUntilNext(curVideoId())
            }
            else {
              tube.communicate({ type: 'set', data: {
                key: 'local.cur_video', val: { id: curVideoId(), title: curVideoTitle() }
              } })
            }
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
    // blocker not initialized.. data fetching broken?
    if(!block) return error("Can't initialize blocker")
    return block.isBlock({ id: curVideoId(), title: curVideoTitle() })
  }

  function curVideoId() {
    return ytplayer.config.args.video_id
  }

  function curVideoTitle() {
    return ytplayer.config.args.title
  }

  // fetch block pocliy from chrome.storage.sync
  function fetchPolicy() {
    tube.communicate({ type: 'get', data: { key: 'sync.policy' } }, function(policy) {
      block = new Block(policy)
    })
  }

  function error(msg) {
    console.error(msg)
    return false
  }
}

Blocker.work()
