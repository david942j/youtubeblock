;(function() {
  let storage = chrome.storage.sync
  function response(data) {
    window.postMessage({
      type: 'FromContentScript',
      data: data
    }, '*');
  }

  document.addEventListener('FromPageJS', function(e) {
    let ar = e.detail.split('.')
    if(ar[0] == 'storage') {
      storage.get(ar[1], function(data) {
        response(data.policy)
      })
    }
  });

  var s = document.createElement('script');
  s.src = chrome.extension.getURL('youtubeblock.js')
  s.id = 'youtubeblock'
  ;(document.head || document.documentElement).appendChild(s)
  s.onload = function() {
    s.remove();
  };
})()
