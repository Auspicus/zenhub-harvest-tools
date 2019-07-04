const $ = jQuery

const param = (e) => {
  let t, r;
  return (() => {
    let n;
    n = [];
    for (t in e)
        r = e[t],
        null != r && n.push(t + "=" + encodeURIComponent(r));
    return n
  })().join("&")
}

const buttonLarge = `
<button class="btn btn-sm harvest-timer-zenhub">
  <svg aria-hidden="true" class="octicon octicon-clock" height="16" role="img" version="1.1" viewBox="0 0 14 16" width="14">
    <path d="M8 8h3v2H7c-0.55 0-1-0.45-1-1V4h2v4z m-1-5.7c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z"></path>
  </svg>
</button>
`

const buttonSmall = `
<div class="harvest-timer-zenhub__track-time-sm zhc-tooltip-action-wrapper" style="position: relative; top: -3px;">
  <button class="zhc-tooltip-action-wrapper__button">
    <svg aria-hidden="true" class="octicon octicon-clock" height="16" role="img" version="1.1" viewBox="0 0 16 16" width="14">
      <path d="M8 8h3v2H7c-0.55 0-1-0.45-1-1V4h2v4z m-1-5.7c3.14 0 5.7 2.56 5.7 5.7S10.14 13.7 7 13.7 1.3 11.14 1.3 8s2.56-5.7 5.7-5.7m0-1.3C3.14 1 0 4.14 0 8s3.14 7 7 7 7-3.14 7-7S10.86 1 7 1z"></path>
    </svg>
  </button>
</div>
`

class ZenhubHarvestTools {
  constructor() {
    const onSubtreeModifiedTicket = () => {
      if ($('.zh-board-popup-overlay').length > 0) {
        if ($('.harvest-timer-zenhub').length < 1) {
          $('.gh-header-actions').append($.parseHTML(buttonLarge));
          $('.harvest-timer-zenhub').click((e) => {
            e.stopPropagation();
            this.openTracker('ticket');
          });
        }
      }
    }
    const onSubtreeModified = () => {
      onSubtreeModifiedTicket();
    }
    let t1
    $(window).bind('DOMSubtreeModified', function () {
      if (t1) clearTimeout(t1);
      t1 = setTimeout(onSubtreeModified, 100);
    });
  }

  openTracker(location, $target) {
    var $overlay = $('.harvest-overlay');

    if ($overlay.length > 0) {
      var $iframe = $overlay.find('#harvest-iframe');
      $iframe.attr('src', 'about:blank');
      $iframe.load(function () {
        $overlay.css('display', 'block');
      })
      $iframe.attr('src', this.getSource(location, $target));
    } else {
      $overlay = document.createElement("div");
      $overlay.className = 'harvest-overlay';
      $overlay.addEventListener('click', () => this.closeTracker()),
      document.addEventListener('keyup', (e) => {
        if (e.which === 27) {
          this.closeTracker()
        }
      })
      this.attachFrame($overlay, location, $target);
      document.body.appendChild($overlay);
    }
  }

  closeTracker() {
    var $overlay = $('.harvest-overlay');
    $overlay.css('display', 'none');
  }

  attachFrame(overlay, location, $target) {
    var frame = document.createElement("iframe");
    frame.id = "harvest-iframe";
    frame.src = this.getSource(location, $target);
    window.addEventListener('message', (e) => {
      if (e.data.type === 'frame:close')
        this.closeTracker();
    })
    $(frame).css('height', 345);
    $(frame).css('width', 500);
    overlay.appendChild(frame);
  }

  getAccount() {
    return window.location.pathname.split('/')[1];
  }

  getProject() {
    return window.location.pathname.split('/')[2];
  }

  getIssueNumber(location, $target) {
    return (location === 'ticket' ? window.location.pathname.split('/')[4] : $($target.closest('.zhc-issue-cards__cell').find('.zhc-issue-card__header').get(0)).find('.zhc-issue-card__issue-number').text().replace('#', ''));
  }

  getIssueName(location, $target) {
    return (
      '#' + 
      this.getIssueNumber(location, $target) +
      ': ' +
      (location === 'ticket'
        ? $.trim($($('.js-issue-title').get(0)).text())
        : $.trim($($target.closest('.zhc-issue-cards__cell').find('.zhc-issue-card__header').get(0)).find('.zhc-issue-card__issue-title').text())));
  }

  getPermalink(location, $target) {
    return (
      'https://github.com/' + 
      this.getAccount() + 
      '/' + 
      this.getProject() + 
      '/issues/' + 
      this.getIssueNumber(location, $target)
    );
  }

  getSource(location, $target) {
    return ('https://platform.harvestapp.com/platform/timer' + '?' + param({
      'app_name': 'Github',
      'service': 'github.com',
      'permalink': this.getPermalink(location, $target),
      'external_account_id': this.getAccount(),
      'external_group_id': this.getProject(),
      'external_group_name': this.getProject(),
      'external_item_id': this.getIssueNumber(location, $target),
      'external_item_name': this.getIssueName(location, $target)
    }));
  }

}



jQuery(document).ready(function($) {
  new ZenhubHarvestTools()
});

/* @todo: integrate

var getHarvestData = function (url) {
  return new Promise(function (resolve, reject) {
    callBackgroundFunction('getAccessToken')
    .then(function (access_token) {
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



var getMonday = function (d) {
  d = new Date(d);
  var day = d.getDay(),
      diff = d.getDate() - day + (day == 0 ? -6:1); // adjust when day is sunday
  return new Date(d.setDate(diff));
}


*/