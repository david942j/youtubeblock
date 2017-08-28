;(function() {
  var s = document.createElement('script');
  s.src = chrome.extension.getURL('youtubeblock.js')
  s.id = 'youtubeblock'
  ;(document.head || document.documentElement).appendChild(s)
})()
