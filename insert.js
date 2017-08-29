;(function() {
  // chrome.storage.sync.set({policy: {ids:[], substr:['周湯豪'] }})
  function response(data) {
    window.postMessage({
      type: 'FromContentScript',
      data: data
    }, '*');
  }

  document.addEventListener('FromPageJS', function(e) {
    if(!(e.detail.type == 'get' || e.detail.type == 'set')) return false
    let keyChain = e.detail.data.key.split('.')
    let s = null
    if(keyChain[0] == 'sync') s = chrome.storage.sync
    else if(keyChain[0] == 'local') s = chrome.storage.local
    else return false
    // get
    if(e.detail.type == 'get') return s.get(keyChain[1], function(data) { response(data[keyChain[1]]) } )
    // set
    // set tabId as well
    chrome.extension.sendMessage({ type: 'getTabId' }, function(res) {
      let dic = { tabId: res.tabId }
      dic[keyChain[1]] = e.detail.data.val
      s.set(dic)
    });
  });

  var s = document.createElement('script');
  s.src = chrome.extension.getURL('youtubeblock.js')
  s.id = 'youtubeblock'
  ;(document.head || document.documentElement).appendChild(s)
  s.onload = function() {
    s.remove();
  };
})()
