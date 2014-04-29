<!--<?php
/**
 * Created by Florin Chelaru ( florinc [at] umd [dot] edu )
 * Date: 4/8/14
 * Time: 1:14 PM
 */

session_start();

const SETTINGS_EXPIRATION_TIME = 2592000; // One month in seconds
const DEFAULT_SETTINGS_ARG = 'default';
const DEFAULT_SETTINGS_FILE = '../epiviz/default-settings.js';
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
      CURLOPT_URL => 'https://api.github.com/gists/' . $settings_gist
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
        CURLOPT_URL => 'https://api.github.com/gists/' . $gist
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

$debug = false;
if (array_key_exists('debug', $_GET) && $_GET['debug'] == 'true') {
  $debug = true;
  $_SESSION['id'] = 0;
  $_SESSION['oauth_id'] = 0;
  $_SESSION['full_name'] = 'Debugger';
  $_SESSION['email'] = null;
  $_SESSION['oauth_provider'] = 'debug';
  $_SESSION['oauth_username'] = 'debugger';
} else if (isset($_SESSION['oauth_provider']) && $_SESSION['oauth_provider'] == 'debug') {
  $debug = false;
  unset($_SESSION['id']);
  unset($_SESSION['oauth_id']);
  unset($_SESSION['full_name']);
  unset($_SESSION['email']);
  unset($_SESSION['oauth_provider']);
  unset($_SESSION['oauth_username']);
}

?>-->
<!DOCTYPE html>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
    <meta name="description" content="EpiViz is a scientific information visualization tool for genetic and epigenetic data, used to aid in the exploration and understanding of correlations between various genome features.">
    <title>EpiViz 2 Test</title>

    <link rel="shortcut icon" href="../../css/epiviz_2_icon.png"/>

    <!-- CSS -->

    <!-- JQuery UI -->
    <link href="../../css/theme/jquery-ui-1.8.9.custom.css" rel="stylesheet">
    <link href="../../css/theme/jquery.ui.selectmenu.css" rel="stylesheet"/>
    <link href="../../css/theme/ui.panel.css" rel="stylesheet"/>
    <link href="../../css/theme/ui.multiselect.css" rel="stylesheet"/>
    <link href="../../css/farbtastic-color-picker/farbtastic.css" rel="stylesheet" />
    <link href="../../css/DataTables-1.9.4/media/css/demo_table.css" rel="stylesheet" />
    <link href="../../css/DataTables-1.9.4/media/css/demo_table_jui.css" rel="stylesheet" />
    <link href="../lib/jquery/DataTables-1.9.4/extras/TableTools/media/css/TableTools.css" rel="stylesheet" />
    <link href="../../css/dropdown-check-list-1.4/css/ui.dropdownchecklist.standalone.css" rel="stylesheet" />

    <!-- EpiViz CSS -->
    <link rel="stylesheet" type="text/css" href="../../css/main.css"/>
    <link rel="stylesheet" type="text/css" href="../../css/svg.css"/>

    <!-- Scripts -->

    <!-- JQuery and JQuery UI scripts -->
    <script src="../lib/jquery/jquery-1.8.2.js"></script>
    <script src="../lib/jquery/jquery-ui-1.9.1.custom.js"></script>
    <script src="../lib/jquery/jquery.multi-accordion-1.5.3.js"></script>
    <script src="../lib/jquery/jquery.ui.selectmenu.js"></script>
    <script src="../lib/jquery/ui.panel.min.js"></script>
    <script src="../lib/jquery/ui.multiselect.js"></script>
    <script src="../lib/jquery/jquery.watermark.min.js"></script>
    <script src="../lib/jquery/jquery.layout-latest.js"></script>
    <script src="../lib/jquery/jquery.activity-indicator-1.0.0.min.js"></script>
    <script src="../lib/jquery/farbtastic-color-picker/farbtastic.js"></script>
    <script src="../lib/jquery/DataTables-1.9.4/media/js/jquery.dataTables.js"></script>
    <script src="../lib/jquery/DataTables-1.9.4/extras/TableTools/media/js/ZeroClipboard.js"></script>
    <script src="../lib/jquery/DataTables-1.9.4/extras/TableTools/media/js/TableTools.js"></script>
    <script src="../lib/jquery/DataTables-1.9.4/extras/ColumnFilter/media/js/jquery.dataTables.columnFilter.js"></script>
    <script src="../lib/jquery/dropdown-check-list-1.4/js/ui.dropdownchecklist.js"></script>

    <!-- D3 -->
    <script src="../lib/d3/d3.v3.min.js"></script>

    <!-- String formatting -->
    <script src="../lib/sprintf-0.6.js"></script>
    <script src="../lib/jquery/globalize/globalize.js"></script>

    <!-- Expression evaluation -->
    <script src="../lib/expression-parser/parser.js"></script>

    <!-- File saving -->
    <script src="../lib/file-saver/FileSaver.js"></script>

    <!-- Google Closure -->
    <script src="../lib/closure/goog/base.js"></script>
    <script src="../lib/closure/goog/structs/collection.js"></script>

    <!-- EpiViz framework -->
    <script src="../epiviz/utils/utils.js"></script>
    <script src="../epiviz/utils/expression-parser.js"></script>
    <script src="../epiviz/utils/iterable.js"></script>
    <script src="../epiviz/utils/iterable-array.js"></script>
    <script src="../epiviz/config.js"></script>
    <script src="../lib/closure/goog/structs/intervaltree.js"></script>

    <script src="../epiviz/events/event-listener.js"></script>
    <script src="../epiviz/events/event.js"></script>
    <script src="../epiviz/events/event-result.js"></script>

    <script src="../epiviz/data/message-type.js"></script>
    <script src="../epiviz/data/request.js"></script>
    <script src="../epiviz/data/request-stack.js"></script>
    <script src="../epiviz/data/response.js"></script>

    <script src="../epiviz/measurements/measurement.js"></script>
    <script src="../epiviz/measurements/measurement-set.js"></script>
    <script src="../epiviz/measurements/measurement-hashtable.js"></script>
    <script src="../epiviz/measurements/measurements-manager.js"></script>

    <script src="../epiviz/data/data-provider.js"></script>
    <script src="../epiviz/data/data-provider-factory.js"></script>
    <script src="../epiviz/data/cache.js"></script>
    <script src="../epiviz/data/data-manager.js"></script>

    <script src="../epiviz/data/websocket-data-provider.js"></script>
    <script src="../epiviz/data/webserver-data-provider.js"></script>
    <script src="../epiviz/data/mock-data-provider.js"></script>

    <script src="../epiviz/datatypes/seq-info.js"></script>
    <script src="../epiviz/datatypes/genomic-array.js"></script>
    <script src="../epiviz/datatypes/genomic-range-array.js"></script>
    <script src="../epiviz/datatypes/feature-value-array.js"></script>
    <script src="../epiviz/datatypes/partial-summarized-experiment.js"></script>
    <script src="../epiviz/datatypes/genomic-data-measurement-wrapper.js"></script>

    <script src="../epiviz/ui/controls/control.js"></script>
    <script src="../epiviz/ui/controls/dialog.js"></script>

    <script src="../epiviz/ui/charts/margins.js"></script>
    <script src="../epiviz/ui/charts/color-palette.js"></script>
    <script src="../epiviz/ui/charts/axis.js"></script>
    <script src="../epiviz/ui/charts/chart-properties.js"></script>
    <script src="../epiviz/ui/charts/ui-object.js"></script>
    <script src="../epiviz/ui/charts/custom-setting.js"></script>
    <script src="../epiviz/ui/charts/chart.js"></script>
    <script src="../epiviz/ui/charts/track.js"></script>
    <script src="../epiviz/ui/charts/plot.js"></script>
    <script src="../epiviz/ui/charts/chart-type.js"></script>
    <script src="../epiviz/ui/charts/track-type.js"></script>
    <script src="../epiviz/ui/charts/plot-type.js"></script>
    <script src="../epiviz/ui/charts/chart-factory.js"></script>
    <script src="../epiviz/ui/charts/chart-manager.js"></script>

    <script src="../epiviz/workspaces/user-manager.js"></script>
    <script src="../epiviz/workspaces/workspace.js"></script>
    <script src="../epiviz/workspaces/workspace-manager.js"></script>

    <script src="../epiviz/datatypes/genomic-range.js"></script>
    <script src="../epiviz/ui/location-manager.js"></script>
    <script src="../epiviz/ui/control-manager.js"></script>
    <script src="../epiviz/ui/web-args-manager.js"></script>

    <script src="../epiviz/epiviz.js"></script>

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
      if (!isset($_SESSION['id'])) {
?>
      epiviz.workspaces.UserManager.USER_STATUS = {
        loggedIn: false,
        name: null,
        oauthProvider: null
      };
<?php
      } else {
?>
      epiviz.workspaces.UserManager.USER_STATUS = {
        loggedIn: true,
        name: '<?php echo $_SESSION['full_name']; ?>',
        oauthProvider: '<?php echo $_SESSION['oauth_provider']; ?>'
      };
<?php
      }
?>

<?php
      foreach ($_GET as $key => $val) {
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
?>
    </script>

    <script src="../epiviz/ui/controls/measurements-dialog-data.js"></script>
    <script src="../epiviz/ui/controls/data-table.js"></script>
    <script src="../epiviz/ui/controls/wizard.js"></script>
    <script src="../epiviz/ui/controls/datasource-group-wizard-step.js"></script>
    <script src="../epiviz/ui/controls/measurements-wizard-step.js"></script>
    <script src="../epiviz/ui/controls/message-dialog.js"></script>
    <script src="../epiviz/ui/controls/color-picker-dialog.js"></script>
    <script src="../epiviz/ui/controls/save-svg-as-image-dialog.js"></script>
    <script src="../epiviz/ui/controls/computed-measurements-dialog.js"></script>
    <script src="../epiviz/ui/controls/custom-settings-dialog.js"></script>

    <script src="../epiviz/plugins/charts/blocks-track.js"></script>
    <script src="../epiviz/plugins/charts/blocks-track-type.js"></script>
    <script src="../epiviz/plugins/charts/line-track.js"></script>
    <script src="../epiviz/plugins/charts/line-track-type.js"></script>
    <script src="../epiviz/plugins/charts/scatter-plot.js"></script>
    <script src="../epiviz/plugins/charts/scatter-plot-type.js"></script>
    <script src="../epiviz/plugins/charts/genes-track.js"></script>
    <script src="../epiviz/plugins/charts/genes-track-type.js"></script>
    <script src="../epiviz/plugins/charts/heatmap-plot.js"></script>
    <script src="../epiviz/plugins/charts/heatmap-plot-type.js"></script>

<?php
    if (is_array($scripts)) {
      foreach ($scripts as $script) {
?>
    <script src="<?php echo $script; ?>"></script>
<?php
      }
    }
?>

    <script src="test-suite.js"></script>
    <script src="test-manager.js"></script>

    <script src="performance/testcases/scatter-plot-test-suite.js"></script>
    <script src="performance/testcases/line-track-test-suite.js"></script>
    <script src="performance/testcases/heatmap-plot-test-suite.js"></script>
    <script src="performance/testcases/blocks-track-test-suite.js"></script>

    <script src="main.js"></script>
  </head>
<body>
  <div class="ui-layout-north">

    <div id="toolbar" class="toolbar-header">
      <div style="float: left; margin-top: 7px; margin-left: 7px; margin-right: 7px">
        <img src="../../img/epiviz_2_logo_medium.png" alt="EpiViz" width="100" height="24" />
      </div>
      <div style="float: right; font-size: small; margin-top: 7px; margin-left: 7px; margin-right: 7px">
<?php
      if (!isset($_SESSION['id'])) {
        echo "<a id=\"login-link\" href=\"javascript:void(0)\">Login</a>";
      } else {
        echo "Welcome, <b>".$_SESSION['full_name']."&nbsp;(@".$_SESSION['oauth_provider'].")</b>!&nbsp;";
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
      <div class="dropdown-menu"><ul id="plot-menu"></ul></div>
      <button id="track-button">Tracks</button>
      <div class="dropdown-menu"><ul id="track-menu"></ul></div>

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

    <div id="test-accordion">
      <h3><a href="#"><b><span style="color: #025167">Test</span></b></a></h3>
      <div id="test-container"></div>
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
</body>
</html>
