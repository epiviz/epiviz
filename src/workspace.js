/**
 * Created with JetBrains PhpStorm.
 * User: florin
 * Date: 2/6/13
 * Time: 11:02 AM
 * To change this template use File | Settings | File Templates.
 */

function Workspace(workspaceId, name, chr, start, end, charts, computedMeasurements) {
  this.workspaceId = workspaceId;
  this.name = name;
  this.chr = chr;
  this.start = start;
  this.end = end;
  this.charts = charts;
  this.computedMeasurements = computedMeasurements;
  this._changed = false;
}

Workspace.DEFAULT_NAME = 'Default Workspace';
Workspace.REQUEST_WORKSPACE = '<request workspace>';

$(function() {
  EventManager.instance.addEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, Workspace);
});

Workspace.onMeasurementsLoaded = function(event) {
  EventManager.instance.removeEventListener(EventManager.eventTypes.MEASUREMENTS_LOADED, Workspace);
  Workspace.beginInitialize();
};

Workspace.beginInitialize = function() {
  DataManager.instance.getWorkspaces(Request.workspace, function(data) {
    Workspace.endInitialize(data);
  });
};

Workspace.endInitialize = function(data) {
  Workspace.workspaces = {};
  Workspace.workspacesData = {};

  var names = {};
  var requestWorkspace = null;

  for (var i = 0; i < data.length; ++i) {
    var workspace = new Workspace(data[i][0], data[i][1], data[i][2], data[i][3], data[i][4], JSON.parse(data[i][5]), JSON.parse(data[i][6]));

    if (!data[i][0]) {
      // This is the Request workspace (belonging to another user)
      Workspace.instance = workspace;
      Workspace.instance.changed();

      requestWorkspace = workspace;

      continue;
    }

    names[workspace.name] = true;

    Workspace.workspaces[data[i][0]] =  workspace;
    Workspace.workspacesData[data[i][0]] = data[i];

    if (data[i][0] == Request.workspace) {
      Workspace.instance = workspace;
      requestWorkspace = workspace;
      continue;
    }

    if (!requestWorkspace && (workspace.name == Workspace.DEFAULT_NAME || !Workspace.instance)) {
      Workspace.instance = workspace;
    }
  }

  if (requestWorkspace && !requestWorkspace.workspaceId && names[requestWorkspace.name]) {
    // First fix the name (no duplicates)
    for (var j = 1; true; ++j) {
      if (!names[requestWorkspace.name + '_' + j]) {
        requestWorkspace.name += '_' + j;
        break;
      }
    }
  }

  if (!Workspace.instance) {
    Workspace.instance = new Workspace(null, Workspace.DEFAULT_NAME, 'chr11', 99800000, 103383180,
      [['genesTrack',['genes']],['blocksTrack',['cpg_islands']]], []);
    Workspace.instance.changed();
  }

  if (Workspace.instance.workspaceId) {
    Request.workspace = Workspace.instance.workspaceId;
  }

  $('#save-workspace-text').val(Workspace.instance.name);

  EventManager.instance.workspaceLoaded();
  UILocation.change(true);
};

Workspace.save = function(name) {
  var w;
  if (name == Workspace.instance.name) {
    w = Workspace.instance;
    w.save();

    if (w.workspaceId) {
      Workspace.workspacesData[w.workspaceId] = [w.workspaceId, w.name, w.chr, w.start, w.end, JSON.stringify(w.charts)];
    }

    return;
  }

  Workspace.instance.update();

  var chr = Workspace.instance.chr;
  var start = Workspace.instance.start;
  var end = Workspace.instance.end;
  var charts = Workspace.instance.charts;
  var computedMeasurements = Workspace.instance.computedMeasurements;

  for (var id in Workspace.workspaces) {
    w = Workspace.workspaces[id];
    if (w.name == name) {
      w.chr = chr;
      w.start = start;
      w.end = end;
      w.charts = charts;
      w.computedMeasurements = computedMeasurements;
      Workspace.instance = w;
      w.save();
      Workspace.workspacesData[w.workspaceId] = [w.workspaceId, w.name, w.chr, w.start, w.end, JSON.stringify(w.charts), JSON.stringify(w.computedMeasurements)];
      return;
    }
  }

  w = new Workspace(null, name, chr, start, end, charts, computedMeasurements);
  Workspace.instance = w;
  w.save();
};


Workspace.switch = function(workspaceId) {
  var data = Workspace.workspacesData[workspaceId];
  Workspace.workspaces[workspaceId] = new Workspace(data[0], data[1], data[2], data[3], data[4], JSON.parse(data[5]), JSON.parse(data[6]));
  var workspace = Workspace.workspaces[workspaceId];

  if (!workspace) {
    return;
  }

  Workspace.instance = workspace;
  EventManager.instance.workspaceLoaded();
  UILocation.chr = workspace.chr;
  UILocation.start = workspace.start;
  UILocation.width = workspace.end - workspace.start;
  UILocation.change(true);

  Request.chr = workspace.chr;
  Request.start = workspace.start;
  Request.end = workspace.end;
  Request.workspace = workspace.workspaceId;

  UILocation.updateUrl();

  $('#save-workspace-text').val(Workspace.instance.name);
};

Workspace.delete = function() {
  var w = Workspace.instance;
  if (w.name == Workspace.DEFAULT_NAME) { return; }

  // Perform the deletion
  DataManager.instance.deleteWorkspace(w, function() {});

  // And then switch to another workspace
  delete Workspace.workspaces[w.workspaceId];
  delete Workspace.workspacesData[w.workspaceId];

  var ids = d3.keys(Workspace.workspaces);
  if (ids.length > 0) {
    Workspace.switch(ids[0]);
  }
};


Workspace.prototype.getCharts = function() {
  return this.charts;
};

Workspace.prototype.getLocation = function() {
  return {
    chr: this.chr,
    start: this.start,
    end: this.end
  };
};

Workspace.prototype.save = function() {
  this.update();

  var self = this;
  DataManager.instance.saveWorkspace(
    {
      id: this.workspaceId,
      name: this.name,
      chr: this.chr,
      start: this.start,
      end: this.end,
      charts: this.charts,
      computedMeasurements: this.computedMeasurements
    },
    function(workspaceId) {
      if (!self.workspaceId) {
        self.workspaceId = workspaceId;
        Workspace.workspacesData[workspaceId] = [self.workspaceId, self.name, self.chr, self.start, self.end, JSON.stringify(self.charts), JSON.stringify(self.computedMeasurements)];

        if (Workspace.instance == self) {
          Request.workspace = workspaceId;
          UILocation.updateUrl();
        }
      }
    });

  this._changed = false;

  MessageDialogs.instance.info('Workspace successfully saved.');
};

Workspace.prototype.update = function() {
  if (this.changing) {
    return;
  }

  this.changing = true;

  this.chr = UILocation.chr;
  this.start = UILocation.start;
  this.end = UILocation.start + UILocation.width;

  var charts = ChartManager.instance.getAllCharts();
  var workspaceCharts = [];
  for (var i = 0; i < charts.length; ++i) {
    workspaceCharts.push(charts[i].getWorkspaceData());
  }

  this.charts = workspaceCharts;
  this.layout = {};

  this.computedMeasurements = ComputedMeasurements.instance.getAllWorkspaceData();

  Request.chr = UILocation.chr;
  Request.start = UILocation.start;
  Request.end = UILocation.start + UILocation.width;

  UILocation.updateUrl();

  this.changing = false;
};

Workspace.prototype.changed = function() {
  this._changed = true;
};

Workspace.prototype.resetChanged = function() {
  this._changed = false;
};

Workspace.prototype.hasChanged = function() {
  return this._changed;
};
