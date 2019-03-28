jQuery( document ).ready(function($) {

  var HARVEST_TEAM = '';
  var CLIENT_ID = '';
  var EXTENSION_ID = '';

  var accessible_functions = {
    getAccessToken: function () {
      return chrome.identity.launchWebAuthFlow({
        'url': 'https://' + HARVEST_TEAM + '.harvestapp.com/oauth2/authorize?client_id=' + CLIENT_ID + '&redirect_uri=https%3A%2F%2F' + EXTENSION_ID + '.chromiumapp.org%2Fprovider_cb&state=optional-csrf-token&response_type=token',
        'interactive': true
      });
    }
  }

  chrome.runtime.onMessage.addListener(function(requested_function, sender, sendResponse) {
    accessible_functions[requested_function]().then(function (result) {
      sendResponse(result);
    });
  });

});
