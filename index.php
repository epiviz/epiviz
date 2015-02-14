<!--<?php

session_start();

const SETTINGS_EXPIRATION_TIME = 2592000; // One month in seconds
const DEFAULT_SETTINGS_ARG = 'default';
const DEFAULT_SETTINGS_FILE = 'src/epiviz/default-settings.js';
$settings_file = (array_key_exists('settings', $_COOKIE)) ? $_COOKIE['settings'] : DEFAULT_SETTINGS_FILE;
if (array_key_exists('settings', $_REQUEST)) {
  $settings_file = $_REQUEST['settings'];
  if ($settings_file == DEFAULT_SETTINGS_ARG) {
    $settings_file = DEFAULT_SETTINGS_FILE;
  }
  setcookie('settings', $settings_file, time() + SETTINGS_EXPIRATION_TIME);
}

$settings_gist = null;
if (array_key_exists('settingsGist', $_REQUEST)) {
  $settings_gist = $_REQUEST['settingsGist'];
  // Get cURL resource
  $curl = curl_init();

  // Set some options - we are passing in a useragent too here
  curl_setopt_array($curl, array(
      CURLOPT_RETURNTRANSFER => 1,
      CURLOPT_SSL_VERIFYPEER => false,
      CURLOPT_SSL_VERIFYHOST => false,
      CURLOPT_USERAGENT => 'epiviz',
      CURLOPT_URL => 'https://api.github.com/gists/' . $settings_gist,
      CURLOPT_USERPWD => '<token>:x-oauth-basic' // TODO: Change <token> to your personal access token
  ));

    // Send the request & save response to $resp
  $resp = curl_exec($curl);
  if ($resp) {
    $json = json_decode($resp, true);
    if (array_key_exists('files', $json)) {
      foreach ($json['files'] as $filename => $details) {
        if (!array_key_exists('type', $details) ||
            stripos($details['type'], 'javascript') === FALSE ||
            !array_key_exists('raw_url', $details)) { continue; }

        $settings_file = 'raw.php?url=' . urlencode($details['raw_url']);
        break;
      }
    }
    setcookie('settings', $settings_file, time() + SETTINGS_EXPIRATION_TIME);
  } else {
    $settings_gist = null;
  }

  // Close request to clear up some resources
  curl_close($curl);
}

$scripts = array();
if (array_key_exists('script', $_REQUEST)) {
  $scripts = $_REQUEST['script'];
}

$gists_map = array();
if (array_key_exists('gist', $_REQUEST)) {
  $gists = $_REQUEST['gist'];

  // Get cURL resource
  $curl = curl_init();

  if (!is_array($scripts)) { $scripts = array(); }
  foreach ($gists as $i => $gist) {
    // Set some options - we are passing in a useragent too here
    curl_setopt_array($curl, array(
        CURLOPT_RETURNTRANSFER => 1,
        CURLOPT_SSL_VERIFYPEER => false,
        CURLOPT_SSL_VERIFYHOST => false,
        CURLOPT_USERAGENT => 'epiviz',
        CURLOPT_URL => 'https://api.github.com/gists/' . $gist,
        CURLOPT_USERPWD => '<token>:x-oauth-basic' // TODO: Change <token> to your personal access token
    ));

    // Send the request & save response to $resp
    $resp = curl_exec($curl);
    if (!$resp) { continue; }

    $json = json_decode($resp, true);
    if (!array_key_exists('files', $json)) { continue; }

    foreach ($json['files'] as $filename => $details) {
      if (!array_key_exists('type', $details) ||
          stripos($details['type'], 'javascript') === FALSE ||
          !array_key_exists('raw_url', $details)) { continue; }

      $script = 'raw.php?url=' . urlencode($details['raw_url']);
      $scripts[] = $script;
      $gists_map[$script] = $gist;
    }
  }

  // Close request to clear up some resources
  curl_close($curl);
}

// Insert here settings based on $_REQUEST.
// All those settings are saved/retrieved as cookies
// TODO: Later on, in javascript, modify cookie when location or workspace are modified
$setting_names = array('ws', 'workspace', 'seqName', 'start', 'end');

$settings = array(); // Used for determining configuration of EpiViz

foreach ($setting_names as $setting) {
  $val = null;
  if (isset($_COOKIE[$setting])) { $val = $_COOKIE[$setting]; }
  if (isset($_REQUEST[$setting])) {
    $val = $_REQUEST[$setting];
    setcookie($setting, $val, time() + SETTINGS_EXPIRATION_TIME);
  }
  if ($val !== null) {
    $settings[$setting] = $val;
  }
}

$user = array_key_exists('user', $_SESSION) ? $_SESSION['user'] : null;
$debug = false;
if (array_key_exists('debug', $_GET) && $_GET['debug'] == 'true') {
  $debug = true;
  $user = array(
      'id' => 0, 'email' => null, 'oauth_uid' => 0, 'oauth_provider' => 'debug', 'full_name' => 'Debugger', 'oauth_username' => null,
      'website_url' => null, 'profile_url' => null, 'photo_url' => null, 'display_name' => 'Debugger', 'description' => null,
      'first_name' => null, 'last_name' => null, 'gender' => null, 'language' => null, 'age' => null, 'birth_day' => null,
      'birth_month' => null, 'birth_year' => null, 'email_verified' => null, 'phone' => null, 'address' => null,
      'country' => null, 'region' => null, 'city' => null, 'zip' => null);
  $_SESSION['user'] = $user;
} else if (isset($_SESSION['oauth_provider']) && $_SESSION['oauth_provider'] == 'debug') {
  $debug = false;
  $user = null;
  unset($_SESSION['user']);
}

?>-->
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="description" content="EpiViz is a scientific information visualization tool for genetic and epigenetic data, used to aid in the exploration and understanding of correlations between various genome features.">
    <title>EpiViz 2</title>

    <base href="<?php echo getenv('base_location'); ?>" target="_blank">

    <link rel="shortcut icon" href="img/epiviz_2_icon.png"/>

    <!-- CSS -->

    <!-- JQuery UI -->
    <link href="css/theme/jquery-ui-1.8.9.custom.css" rel="stylesheet">
    <link href="css/theme/jquery.ui.selectmenu.css" rel="stylesheet"/>
    <link href="css/theme/ui.panel.css" rel="stylesheet"/>
    <link href="css/theme/ui.multiselect.css" rel="stylesheet"/>
    <link href="css/farbtastic-color-picker/farbtastic.css" rel="stylesheet" />
    <link href="css/DataTables-1.9.4/media/css/demo_table.css" rel="stylesheet" />
    <link href="css/DataTables-1.9.4/media/css/demo_table_jui.css" rel="stylesheet" />
    <link href="src/lib/jquery/DataTables-1.9.4/extras/TableTools/media/css/TableTools.css" rel="stylesheet" />
    <link href="css/dropdown-check-list-1.4/css/ui.dropdownchecklist.standalone.css" rel="stylesheet" />

    <!-- Code editor -->
    <link rel="stylesheet" href="css/codemirror-4.5/lib/codemirror.css">

    <!-- EpiViz CSS -->
    <link rel="stylesheet" type="text/css" href="css/main.css"/>
    <link rel="stylesheet" type="text/css" href="css/svg.css"/>

    <!-- Scripts -->

    <!-- JQuery and JQuery UI scripts -->
    <script src="src/lib/jquery/jquery-1.8.2.js"></script>
    <script src="src/lib/jquery/jquery-ui-1.9.1.custom.js"></script>
    <script src="src/lib/jquery/jquery.multi-accordion-1.5.3.js"></script>
    <script src="src/lib/jquery/jquery.ui.selectmenu.js"></script>
    <script src="src/lib/jquery/ui.panel.min.js"></script>
    <script src="src/lib/jquery/ui.multiselect.js"></script>
    <script src="src/lib/jquery/jquery.watermark.min.js"></script>
    <script src="src/lib/jquery/jquery.layout-latest.js"></script>
    <script src="src/lib/jquery/jquery.activity-indicator-1.0.0.min.js"></script>
    <script src="src/lib/jquery/DataTables-1.9.4/media/js/jquery.dataTables.js"></script>
    <script src="src/lib/jquery/DataTables-1.9.4/extras/TableTools/media/js/ZeroClipboard.js"></script>
    <script src="src/lib/jquery/DataTables-1.9.4/extras/TableTools/media/js/TableTools.js"></script>
    <script src="src/lib/jquery/DataTables-1.9.4/extras/ColumnFilter/media/js/jquery.dataTables.columnFilter.js"></script>
    <script src="src/lib/jquery/dropdown-check-list-1.4/js/ui.dropdownchecklist.js"></script>

    <!-- D3 -->
    <script src="src/lib/d3/d3.v3.min.js"></script>

    <!-- String formatting -->
    <script src="src/lib/sprintf-0.6.js"></script>
    <script src="src/lib/jquery/globalize/globalize.js"></script>

    <!-- Expression evaluation -->
    <script src="src/lib/expression-parser/parser.js"></script>

    <!-- Code editor -->
    <script src="src/lib/codemirror-4.5/lib/codemirror.js"></script>
    <script src="src/lib/codemirror-4.5/addon/edit/matchbrackets.js"></script>
    <script src="src/lib/codemirror-4.5/addon/comment/continuecomment.js"></script>
    <script src="src/lib/codemirror-4.5/addon/comment/comment.js"></script>
    <script src="src/lib/codemirror-4.5/mode/javascript/javascript.js"></script>

    <!-- File upload: src/file-upload/webtoolkit.aim.js -->

    <!-- Google Closure -->
    <script src="src/lib/closure/goog/base.js"></script>
    <script src="src/lib/closure/goog/structs/collection.js"></script>

    <!-- EpiViz framework -->
    <script src="src/epiviz/utils/utils.js"></script>
    <script src="src/epiviz/utils/expression-parser.js"></script>
    <script src="src/epiviz/utils/farbtastic.js"></script>
    <script src="src/epiviz/utils/iterable.js"></script>
    <script src="src/epiviz/utils/iterable-array.js"></script>
    <script src="src/epiviz/config.js"></script>
    <script src="src/lib/closure/goog/structs/intervaltree.js"></script>

    <script src="src/epiviz/events/event-listener.js"></script>
    <script src="src/epiviz/events/event.js"></script>
    <script src="src/epiviz/events/event-result.js"></script>

    <script src="src/epiviz/data/message-type.js"></script>
    <script src="src/epiviz/data/request.js"></script>
    <script src="src/epiviz/data/request-stack.js"></script>
    <script src="src/epiviz/data/response.js"></script>

    <script src="src/epiviz/measurements/measurement.js"></script>
    <script src="src/epiviz/measurements/measurement-set.js"></script>
    <script src="src/epiviz/measurements/measurement-hashtable.js"></script>
    <script src="src/epiviz/measurements/measurements-manager.js"></script>

    <script src="src/epiviz/data/data-provider.js"></script>
    <script src="src/epiviz/data/data-provider-factory.js"></script>
    <script src="src/epiviz/data/cache.js"></script>
    <script src="src/epiviz/data/data-manager.js"></script>

    <script src="src/epiviz/data/empty-response-data-provider.js"></script>
    <script src="src/epiviz/data/websocket-data-provider.js"></script>
    <script src="src/epiviz/data/webserver-data-provider.js"></script>
    <script src="src/epiviz/data/mock-data-provider.js"></script>

    <script src="src/epiviz/datatypes/seq-info.js"></script>
    <script src="src/epiviz/datatypes/genomic-array.js"></script>
    <script src="src/epiviz/datatypes/genomic-range-array.js"></script>
    <script src="src/epiviz/datatypes/feature-value-array.js"></script>
    <script src="src/epiviz/datatypes/partial-summarized-experiment.js"></script>
    <script src="src/epiviz/datatypes/genomic-data-measurement-wrapper.js"></script>

    <script src="src/epiviz/ui/controls/control.js"></script>
    <script src="src/epiviz/ui/controls/dialog.js"></script>

    <script src="src/epiviz/ui/charts/transform/clustering/cluster-node.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/cluster-subtree.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/cluster-leaf.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/cluster-tree.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/clustering-metric.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/clustering-linkage.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/hierarchical-clustering-algorithm.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/euclidean-metric.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/complete-linkage.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/none-clustering.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/agglomerative-clustering.js"></script>
    <script src="src/epiviz/ui/charts/transform/clustering/clustering-algorithm-factory.js"></script>

    <script src="src/epiviz/ui/charts/margins.js"></script>
    <script src="src/epiviz/ui/charts/color-palette.js"></script>
    <script src="src/epiviz/ui/charts/axis.js"></script>
    <script src="src/epiviz/ui/charts/chart-properties.js"></script>
    <script src="src/epiviz/ui/charts/ui-object.js"></script>
    <script src="src/epiviz/ui/charts/custom-setting.js"></script>
    <script src="src/epiviz/ui/charts/chart.js"></script>
    <script src="src/epiviz/ui/charts/track.js"></script>
    <script src="src/epiviz/ui/charts/plot.js"></script>
    <script src="src/epiviz/ui/charts/chart-type.js"></script>
    <script src="src/epiviz/ui/charts/track-type.js"></script>
    <script src="src/epiviz/ui/charts/plot-type.js"></script>
    <script src="src/epiviz/ui/charts/chart-factory.js"></script>

    <script src="src/epiviz/ui/charts/decoration/chart-decoration.js"></script>
    <script src="src/epiviz/ui/charts/decoration/chart-option-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/remove-chart-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/save-chart-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/chart-colors-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/custom-settings-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/toggle-tooltip-button.js"></script>
    <script src="src/epiviz/ui/charts/decoration/edit-code-button.js"></script>

    <script src="src/epiviz/ui/charts/decoration/chart-resize.js"></script>
    <script src="src/epiviz/ui/charts/decoration/chart-tooltip.js"></script>
    <script src="src/epiviz/ui/charts/decoration/chart-loader-animation.js"></script>

    <script src="src/epiviz/ui/charts/chart-manager.js"></script>

    <script src="src/epiviz/workspaces/user-manager.js"></script>
    <script src="src/epiviz/workspaces/workspace.js"></script>
    <script src="src/epiviz/workspaces/workspace-manager.js"></script>

    <script src="src/epiviz/datatypes/genomic-range.js"></script>
    <script src="src/epiviz/ui/location-manager.js"></script>
    <script src="src/epiviz/ui/control-manager.js"></script>
    <script src="src/epiviz/ui/web-args-manager.js"></script>

    <script src="src/epiviz/epiviz.js"></script>

    <script src="src/epiviz/ui/controls/measurements-dialog-data.js"></script>
    <script src="src/epiviz/ui/controls/data-table.js"></script>
    <script src="src/epiviz/ui/controls/wizard.js"></script>
    <script src="src/epiviz/ui/controls/datasource-group-wizard-step.js"></script>
    <script src="src/epiviz/ui/controls/measurements-wizard-step.js"></script>
    <script src="src/epiviz/ui/controls/message-dialog.js"></script>
    <script src="src/epiviz/ui/controls/color-picker-dialog.js"></script>
    <script src="src/epiviz/ui/controls/save-svg-as-image-dialog.js"></script>
    <script src="src/epiviz/ui/controls/computed-measurements-dialog.js"></script>
    <script src="src/epiviz/ui/controls/custom-settings-dialog.js"></script>
    <script src="src/epiviz/ui/controls/code-edit-dialog.js"></script>

    <script src="src/epiviz/plugins/charts/blocks-track.js"></script>
    <script src="src/epiviz/plugins/charts/blocks-track-type.js"></script>
    <script src="src/epiviz/plugins/charts/line-track.js"></script>
    <script src="src/epiviz/plugins/charts/line-track-type.js"></script>
    <script src="src/epiviz/plugins/charts/scatter-plot.js"></script>
    <script src="src/epiviz/plugins/charts/scatter-plot-type.js"></script>
    <script src="src/epiviz/plugins/charts/genes-track.js"></script>
    <script src="src/epiviz/plugins/charts/genes-track-type.js"></script>
    <script src="src/epiviz/plugins/charts/heatmap-plot.js"></script>
    <script src="src/epiviz/plugins/charts/heatmap-plot-type.js"></script>

    <script src="src/epiviz/main.js"></script>
    
    <!-- Dynamic initializations -->
    <script src="<?php echo $settings_file; ?>"></script>

    <script>

      var items;
<?php
    foreach ($settings as $setting => $val) {
      if (!is_array($val)) {
?>
      epiviz.EpiViz.SETTINGS['<?php echo $setting; ?>'] = '<?php echo $val; ?>';
<?php
      } else {
?>
      items = [];
<?php
        foreach ($val as $item) {
?>
      items.push('<?php echo $item; ?>');
<?php
        }
?>
      epiviz.EpiViz.SETTINGS['<?php echo $setting; ?>'] = items;
<?php
      }
    }
?>

<?php
    if ($user === null) {
?>
      epiviz.workspaces.UserManager.USER_STATUS = {
        loggedIn: false,
        oauthProvider: null,
        userData: null
      };
<?php
    } else {
?>
      epiviz.workspaces.UserManager.USER_STATUS = {
        loggedIn: true,
        oauthProvider: '<?php echo $user['oauth_provider']; ?>',
        userData: <?php echo json_encode($user) . "\n"; ?>
      };
<?php
    }
?>

<?php
    foreach ($_GET as $key => $val) {
      // We'll deal with this later
      if ($key == 'script' || $key == 'settings') { continue; }
      if (is_array($val)) {
?>
      items = [];
<?php
        foreach ($val as $item) {
?>
      items.push('<?php echo $item; ?>');
<?php
        }
?>
      epiviz.ui.WebArgsManager.WEB_ARGS['<?php echo $key; ?>'] = items;
<?php
      } else {
?>
      epiviz.ui.WebArgsManager.WEB_ARGS['<?php echo $key; ?>'] = '<?php echo $val; ?>';
<?php
      }
    }

    $settings_arg =  ($settings_file == DEFAULT_SETTINGS_FILE) ? DEFAULT_SETTINGS_ARG : $settings_file;

    if ($settings_gist != null) {
?>
      epiviz.ui.WebArgsManager.WEB_ARGS['settingsGist'] = '<?php echo $settings_gist; ?>';
<?php
    } else {
?>
      epiviz.ui.WebArgsManager.WEB_ARGS['settings'] = '<?php echo $settings_arg; ?>';
<?php
    }
    if (is_array($scripts) && count($scripts) == 0) { $scripts = DEFAULT_SETTINGS_ARG; }
    if ($scripts != DEFAULT_SETTINGS_ARG) {
?>
      items = [];
<?php
      foreach ($scripts as $item) {
        if (strpos($item, 'raw.php') === 0 && array_key_exists($item, $gists_map)) { continue; }
?>
      items.push('<?php echo $item; ?>');
<?php
      }
?>
      epiviz.ui.WebArgsManager.WEB_ARGS['script'] = items;
<?php
    }

?>
    </script>
    
<?php
    if (is_array($scripts)) {
      foreach ($scripts as $script) {
?>
    <script src="<?php echo $script; ?>"></script>
<?php
      }
    }
?>

    <script>
      // Run main once the page has loaded
      $(epiviz.main);
    </script>
    
  </head>
  <body>
    <div class="ui-layout-north">

      <div id="toolbar" class="toolbar-header">
        <div style="float: left; margin-top: 7px; margin-left: 7px; margin-right: 7px">
          <img src="img/epiviz_2_logo_medium.png" alt="EpiViz" width="100" height="24" />
        </div>
        <div style="float: right; font-size: small; margin-top: 7px; margin-left: 7px; margin-right: 7px">
          <?php
          if ($user === null) {
            echo "<a id=\"login-link\" href=\"javascript:void(0)\">Login</a>";
          } else {
            echo "Welcome, <b>".$user['display_name']."&nbsp;(@".$user['oauth_provider'].")</b>!&nbsp;";
            echo "<a id=\"login-link\" href=\"javascript:void(0)\">logout</a>";
          }
          ?>
        </div>

        <select id="chromosome-selector"></select>
        <input id="text-location" class="ui-widget-content ui-corner-all" type="text"/>
        <button id="moveleft">Slide left</button>
        <button id="moveright">Slide right</button>

        <button id="zoomin">Zoom in</button>
        <button id="zoomout">Zoom out</button>

        <button id="location-settings">Location Settings...</button>

        <span class="separator">|</span>

        <button id="plot-button">Plots</button>
        <div class="dropdown-menu">
          <ul id="plot-menu"></ul>
        </div>
        <button id="track-button">Tracks</button>
        <div class="dropdown-menu">
          <ul id="track-menu"></ul>
        </div>

        <button id="computed-measurements-button">Computed Measurements</button>

        <span class="separator">|</span>

        <label for="search-box"></label>
        <input id="search-box" class="ui-widget-content ui-corner-all" type="text" />

        <span class="separator">|</span>

        <label for="save-workspace-text"></label>
        <input id="save-workspace-text" class="ui-widget-content ui-corner-all" type="text"/>
        <button id="save-workspace-button">Save Workspace</button>
        <button id="delete-workspace-button">Delete Active Workspace</button>

        <span class="separator">|</span>

        <button id="help-button">Help</button>
      </div>
    </div>

    <div id="pagemain" class="ui-layout-center">
      <div id="top-accordion">
        <h3><a href="#"><b><span style="color: #025167">Views by Feature</span></b></a></h3>
        <div id="chart-container"></div>
      </div>
      <div id="bottom-accordion">
          <h3><a href="#"><b><span style="color: #025167">Views by Location</span></b></a></h3>
          <div id="track-container"></div>
      </div>
    </div>

    <div id="pagefooter" class="ui-layout-south"></div>

    <div id="dialogs">
      <div id="location-settings-dialog" title="Location Settings">
        <table>
          <tr>
            <td><label>Zoom-in Ratio:</label></td>
            <td><input id="zoomin-ratio-text" type="text" /></td>
          </tr>
          <tr>
            <td><label>Zoom-out Ratio:</label></td>
            <td><input id="zoomout-ratio-text" type="text" /></td>
          </tr>
          <tr>
            <td><label>Navigation Step Ratio:</label></td>
            <td><input id="navigation-step-ratio-text" type="text" /></td>
          </tr>
        </table>
      </div>
    </div>

    <!-- Unimportant scripts -->

    <!-- Google Analytics -->
    <script src="src/lib/google-analytics/google-analytics.js"></script>
  </body>

</html>
