var stack = [];
var current = [];
const rumurDownload = (item) => {
  if (!item) {
    return false;
  }
  chrome.downloads.download({
    url: item.url,
    filename: item.name,
    saveAs: true,
  });
}

chrome.runtime.onMessage.addListener( (element) => {
  if (element.action == 'downloadFile') {
    stack = element.stack;
    current = stack.shift();
    if (current) {
      rumurDownload(current);
    }
  }
});

chrome.downloads.onChanged.addListener( (element) => {
  current = stack.shift();
  if (current && element.hasOwnProperty('endTime') === false) {
    rumurDownload(current);
  }
});