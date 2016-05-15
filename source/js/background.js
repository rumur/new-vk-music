const downloadFile = {
  startDownload: function (e) {
    if (!e) return;
    chrome.downloads.download({
        url: e.url,
        filename: e.name
      },
      function (t) {
        console.log('File is downloading...');
      })
  }
};
chrome.runtime.onMessage.addListener(function (e, t, n) {
  if (e.action == "downloadFile") {
    downloadFile.startDownload({
      url: e.url,
      name: e.name
    });
  }
});