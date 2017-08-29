/* Created By david942j, 2017 */
"use strict";

;(function() {
  function init() {
    refreshView()
    bindEvents()
  }

  function refreshView() {
    policyView()
    playingView()
  }

  function policyView() {
    getPolicy(function(policy) {
      let ul = document.getElementById('blockids')
      ul.innerHTML = ''
      for(let i = 0; i < policy.ids.length; i++) {
        let li = document.createElement('li')
        let del = document.createElement('span')
        del.innerHTML = '🗑️'
        del.className = 'button'
        li.onclick = (function(id) { 
          return function() { removePolicyById(id) }
        })(policy.ids[i])
        li.appendChild(del)
        li.innerHTML += ' ' + policy.ids[i]
        ul.appendChild(li)
      }
      ul = document.getElementById('blocksubstr')
      ul.innerHTML = ''
      for(let i = 0; i < policy.substr.length; i++) {
        let li = document.createElement('li')
        let del = document.createElement('span')
        del.innerHTML = '🗑️'
        del.className = 'button'
        li.onclick = (function(str) { 
          return function() { removePolicyBySubstr(str) }
        })(policy.substr[i])
        li.appendChild(del)
        li.innerHTML += ' ' + policy.substr[i]
        ul.appendChild(li)
      }
    })
  }

  function playingView() {
    chrome.storage.local.get('cur_video', function(e) {
      let video = e.cur_video
      let div = document.getElementById('playing')
      div.innerHTML = "<span title='" + video.title + "' data-id='" + video.id + "'>" + video.title + "</span>"
    })
  }

  function bindEvents() {
    // detect storage change
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      for (let key in changes) {
        if(key == 'cur_video') playingView()
        if(key == 'policy') policyView()
      }
    })
    let btn = document.getElementById('add-button')
    btn.onclick = function() {
      getPolicy(function(p) {
        getLocal('cur_video', function(video) {
          if(p.ids.includes(video.id)) return false
          p.ids.push(video.id)
          changePolicy(p)
        })
      })
    }

    btn = document.getElementById('add-substr')
    btn.onclick = function() {
      let str = document.getElementById('input-substr').value
      if(typeof str !== 'string' || str.length == 0) return false
      getPolicy(function(policy) {
        if(policy.substr.includes(str)) return false
        document.getElementById('input-substr').value = ''
        policy.substr.push(str)
        changePolicy(policy)
      })
    }

    // binding enter to click
    document.onkeydown = function (e) {
      e = e || window.event;
      switch (e.which || e.keyCode) {
        case 13: btn.click()
          break;
      }
    }
  }

  function getSync(name, callback) {
    chrome.storage.sync.get(name, function(e) { return callback(e[name]) })
  }

  function getPolicy(callback) {
    getSync('policy', function(p) {
      if(!p) p = { ids: [], substr: [] }
      callback(p)
    })
  }

  function getLocal(name, callback) {
    chrome.storage.local.get(name, function(e) { return callback(e[name]) })
  }

  function changePolicy(p) {
    chrome.storage.sync.set({ policy: p }, function() {
      getLocal('tabId', function(tabId) {
        if(typeof tabId !== 'number') return false
        chrome.tabs.executeScript(tabId, {
          file: 'post_message.js'
        })
      })
    })
  }

  function removePolicyById(id) {
    getPolicy(function(policy) {
      let idx = policy.ids.indexOf(id)
      if(idx === -1) return false
      policy.ids.splice(idx, 1)
      changePolicy(policy)
    })
  }

  function removePolicyBySubstr(str) {
    getPolicy(function(policy) {
      let idx = policy.substr.indexOf(str)
      if(idx === -1) return false
      policy.substr.splice(idx, 1)
      changePolicy(policy)
    })
  }

  init()
})()
