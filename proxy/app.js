function doGet(e) {
  var response = UrlFetchApp.fetch(e.parameter.url);
  var output = response.getContentText();
  return ContentService.createTextOutput(output);
}
