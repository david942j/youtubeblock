var Blocker = new function() {
  let thisObj, block = null
  let YT_PLAY = 1
  let videoConfig = null

  // to communicate with content script
  let tube = new function() {
    let response = null
    window.addEventListener('message', function(event) {
      if(event.data.type == 'FromContentScript')
        return response && response(event.data.data)
      if(event.data.type == 'FromPopUp') {
        if(event.data.data == 'reload') fetchPolicy(function() { checkSkip() })
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
      hookXML()
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
          thisObj.state = e
          if(e == YT_PLAY) {
            console.log('play start %s', thisObj.skip)
            checkSkip() // might do nothing
          }
          if(orig) return orig.apply(window, arguments)
        }
      })
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

  // Skip videos when:
  // 1. Video is playing
  // 2. Url consistents with xhr response
  // 3. Match skip policy
  function checkSkip() {
    if(thisObj.state != YT_PLAY) return false
    if(getQueryVariable('v') != curVideoId()) return false
    if(!needSkip()) return false
    doSkip()
  }

  function doSkip() {
    console.log('doSkip')
    // first pause the video
    let ele = document.getElementsByClassName('ytp-play-button')[0]
    if(ele) ele.click()
    tryUntilNext(curVideoId())
  }

  function tryUntilNext(skipId) {
    console.log("Skip %s", skipId)
    if(curVideoId() == skipId) {
      let ele = document.getElementsByClassName('ytp-next-button')[0]
      console.log(ele.href)
      if(ele) ele.click()
      setTimeout(function() { tryUntilNext(skipId) }, 1000)
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
    if(videoConfig) return videoConfig.video_id
    return ''
  }

  function getQueryVariable(variable, url) {
    url = url || window.location.href
    let vars = url.substring(url.indexOf('?') + 1, url.length).split('&')
    for (var i = 0; i < vars.length; i++) {
      var pair = vars[i].split('=')
      if (decodeURIComponent(pair[0]) == variable)
        return decodeURIComponent(pair[1])
    }
    return ''
  }

  function curVideoTitle() {
    if(videoConfig) return videoConfig.title
    return ''
  }

  // fetch block pocliy from chrome.storage.sync
  function fetchPolicy(callback) {
    tube.communicate({ type: 'get', data: { key: 'sync.policy' } }, function(policy) {
      block = new Block(policy)
      if(callback) callback()
    })
  }

  // Hook XMLHttpRequest::open
  function hookXML() {
    let origOpen = XMLHttpRequest.prototype.open;
    function isFetchVideo(args) {
      if(args[0] != 'GET') return false
      let target = 'https://www.youtube.com/watch'
      if(args[1].substr(0, target.length) != target) return false
      return true
    }
    XMLHttpRequest.prototype.open = function() {
      if(isFetchVideo(arguments)) {
        console.log('fetched')
        this.addEventListener('load', function() {
          let data = JSON.parse(this.responseText)[2]
          if(data.player) videoConfig = data.player.args
          else videoConfig = data.data.swfcfg.args
          console.log(curVideoTitle())
          if(needSkip())
            checkSkip() // might do nothing
          else {
            // set storage iff not matching policy
            tube.communicate({ type: 'set', data: {
              key: 'local.cur_video', val: { id: curVideoId(), title: curVideoTitle() }
            } })
          }
        })
      }
      origOpen.apply(this, arguments);
    }
  }

  function error(msg) {
    console.error(msg)
    return false
  }
}

Blocker.work()
