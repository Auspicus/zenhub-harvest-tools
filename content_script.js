jQuery(document).ready(function($) {

  var HARVEST_TEAM = '';

  var param = function(e) {
      var t, r;
      return function() {
          var n;
          n = [];
          for (t in e)
              r = e[t],
              null != r && n.push(t + "=" + encodeURIComponent(r));
          return n
      }().join("&")
  }

  var getButton = function (size) {
    return new Promise(function (resolve, reject) {
      if (!window['harvestZenhubTracktime__button_' + size]) {
        $.get(chrome.extension.getURL('/buttons/button-' + size + '.html'), function (data) {
          window['harvestZenhubTracktime__button_' + size] = data;
          resolve(data);
        });
      } else {
        resolve(window['harvestZenhubTracktime__button_' + size]);
      }
    });
  }

  var callBackgroundFunction = function (function_name) {
    return new Promise(function (resolve, reject) {
      chrome.runtime.sendMessage(function_name, function (response) {
        resolve(response);
      });
    });
  }

  var getHarvestData = function (url) {
    return new Promise(function (resolve, reject) {
      callBackgroundFunction('getAccessToken')
      .then(function (access_token) {
        console.log(access_token);
        $.ajax('https://'
          + HARVEST_TEAM
          + '.harvestapp.com/'
          + url
          + '?access_token=' + access_token, {
          crossDomain: true,
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
          },
          success: function (data, textStatus, xhr) {
            resolve(data);
          },
        });
      });
    });
  }

  var getProjectId = function () {
    return new Promise(function (resolve, reject) {
      if (!window.harvestZenhubTracktime__projectId) {
        getHarvestData('projects')
        .then(function (data) {
          window.harvestZenhubTracktime__projects = data;
          window.harvestZenhubTracktime__projects.forEach(function (p) {
            if (p.project.name.toLowerCase() === getProject()) {
              resolve(window.harvestZenhubTracktime__projectId = p.project.id);
            }
          })
          reject('Error: failed to find your projects');
        });
      } else {
        resolve(window.harvestZenhubTracktime__projectId);
      }
    })
  }

  var getTrackedTime = function () {
    return new Promise(function (resolve, reject) {
      getProjectId()
      .then(function (id) {
        if (!window.harvestZenhubTools__trackedTime) {
          getHarvestData('projects/' + id + '/entries?from=20170115&to=20170117')
          .then(function (data) {
            console.log('asdf');
            console.log(data);
          })
          .catch(function (err) {
            console.error(err);
          });
        } else {
          resolve(data);
        }
      });
    });
  }

  var getMonday = function (d) {
    d = new Date(d);
    var day = d.getDay(),
        diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
    return new Date(d.setDate(diff));
  }

  var getAccount = function () {
    return window.location.pathname.split('/')[1];
  }

  var getProject = function () {
    return window.location.pathname.split('/')[2];
  }

  var getIssueNumber = function (location, $target) {
    return (location === 'ticket' ? window.location.pathname.split('/')[4] : $($target.closest('.zhc-issue-cards__cell').find('.zhc-issue-card__header').get(0)).find('.zhc-issue-card__issue-number').text().replace('#', ''));
  }

  var getIssueName = function (location, $target) {
    return ('#' + getIssueNumber(location, $target) + ': ' + (location === 'ticket' ? $.trim($('.js-issue-title').text()) : $.trim($($target.closest('.zhc-issue-cards__cell').find('.zhc-issue-card__header').get(0)).find('.zhc-issue-card__issue-title').text())));
  }

  var getPermalink = function (location, $target) {
    return ('https://github.com/' + getAccount() + '/' + getProject() + '/issues/' + getIssueNumber(location, $target));
  }

  var getSource = function (location, $target) {
    return ('https://platform.harvestapp.com/platform/timer' + '?' + param({'app_name': 'Github', 'service': 'github.com', 'permalink': getPermalink(location, $target), 'external_account_id': getAccount(), 'external_group_id': getProject(), 'external_group_name': getProject(), 'external_item_id': getIssueNumber(location, $target), 'external_item_name': getIssueName(location, $target)}));
  }

  var attachFrame = function (overlay, location, $target) {
    var frame = document.createElement("iframe");
    frame.id = "harvest-iframe";
    frame.src = getSource(location, $target);
    window.addEventListener('message', function (e) {
      if (e.data.type === 'frame:close') closeTracker();
    })
    $(frame).css('height', 345);
    $(frame).css('width', 500);
    overlay.appendChild(frame);
  }

  var closeTracker = function () {
    var $overlay = $('.harvest-overlay');
    $overlay.css('display', 'none');
  }

  var openTracker = function (location, $target) {
    var $overlay = $('.harvest-overlay');

    if ($overlay.length > 0) {
      var $iframe = $overlay.find('#harvest-iframe');
      $iframe.attr('src', 'about:blank');
      $iframe.load(function () {
        $overlay.css('display', 'block');
      })
      $iframe.attr('src', getSource(location, $target));
    } else {
      $overlay = document.createElement("div");
      $overlay.className = 'harvest-overlay';

      $overlay.addEventListener("click", function(e) {
          return function(t) {
              return closeTracker()
          }
      }(this)),
      document.addEventListener("keyup", function(e) {
          return function(t) {
              if (t.which === 27) closeTracker()
          }
      }(this))

      attachFrame($overlay, location, $target);

      document.body.appendChild($overlay);
    }
  }

  var attachEventListeners = function () {
    var t1;
    $(window).bind('DOMSubtreeModified', function () {
      if (t1) clearTimeout(t1);
      t1 = setTimeout(onSubtreeModified, 100);
    });

    var onSubtreeModified = function () {
      onSubtreeModifiedBoards();
      onSubtreeModifiedTicket();
    }

    var onSubtreeModifiedTicket = function () {
      if ($('.zh-board-popup-overlay').length > 0) {
        if ($('.harvest-timer-zenhub').length < 1) {
          getButton('lg').then(function (data) {
            if ($('.harvest-timer-zenhub').length < 1) {
              $('.gh-header-actions').append($.parseHTML(data));
              $('.harvest-timer-zenhub').click(function (e) {
                e.stopPropagation();
                openTracker('ticket');
              });
            }
          })
        }
      }
    }

    var onSubtreeModifiedBoards = function () {
      //getTrackedTime();

      $('.zhc-issue-cards__cell').each(function (i, el) {
        if ($(el).find('.harvest-timer-zenhub__track-time-sm').length < 1) {
          getButton('sm').then(function (data) {
            if ($(el).find('.harvest-timer-zenhub__track-time-sm').length < 1) {
              $(el).find('.zhc-issue-card__icon--actions').prepend($.parseHTML(data));
              $('.harvest-timer-zenhub__track-time-sm').click(function (e) {
                e.stopPropagation();
                openTracker('boards', $(e.target));
              });
            }
          });
        }
      })
    }
  }

  getButton('sm');
  getButton('lg');
  attachEventListeners();

});
