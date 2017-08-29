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
    let ul = document.getElementById('blocklist')
    ul.innerHTML = ''
    getPolicy(function(policy) {
      for(let i = 0; i < policy.ids.length; i++) {
        let li = document.createElement('li')
        li.innerHTML = policy.ids[i]
        ul.appendChild(li)
      }
      for(let i = 0; i < policy.substr.length; i++) {
        let li = document.createElement('li')
        li.innerHTML = policy.substr[i]
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
      for (key in changes) {
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
          chrome.storage.sync.set({ policy: p }, function() {
            policyView()
            getLocal('tabId', function(tabId) {
              chrome.tabs.executeScript(tabId, {
                file: 'post_message.js'
              })
            })
          })
        })
      })
    }
  }

  function getSync(name, callback) {
    chrome.storage.sync.get(name, function(e) { return callback(e[name]) })
  }

  function getPolicy(callback) {
    getSync('policy', callback)
  }

  function getLocal(name, callback) {
    chrome.storage.local.get(name, function(e) { return callback(e[name]) })
  }

  init()
})()
