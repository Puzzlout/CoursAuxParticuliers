var app = new Vue({
  el: "#app",
  data: {
    sheetUrl:
      "https://docs.google.com/spreadsheets/d/1OMSN3nSNU4ba7thwK76LIXHX5KLbh5T7I8xJySYPMB0/pubhtml",
    sections: {},
    loading: true,
    enableLog: true
  },
  methods: {
    getSpreadsheetData: function() {
      self = this;
      return new Promise(function(resolve, reject) {
        var options = {
          key: self.sheetUrl,
          callback: onLoad,
          simpleSheet: true
        };

        function onLoad(data, tabletop) {
          // 'data' is the array for a simple spreadsheet
          // 'tabletop' is the whole object with sheets and more.
          // could resolve(tabletop) too.

          // probably should do an error check here and then:
          // if (err) {reject(err); }

          resolve(tabletop);
          return;
        }

        Tabletop.init(options);
      });
    },
    processSheetData: function(tabletop) {
      console.log(tabletop);
      tabletop.modelNames.forEach(sheetName => {
        var sheet = tabletop.models[sheetName];
        if (this.enableLog) console.log(`Sheet ${sheetName}`, sheet.elements);
        var labels = [];
        sheet.elements.forEach(row => {
          labels.push({
            key: row.Key,
            value: row.Value
          });
        });
        Object.defineProperty(this.sections, sheetName, {
          value: labels
        });
      });
      if (this.enableLog) console.log("Sections", this.sections);
      this.loading = false;
    },
    loadSheetData: function() {
      var runPromise = this.getSpreadsheetData();
      self = this;
      runPromise
        .then(function(tabletop) {
          self.processSheetData(tabletop);
        })
        .catch(promise_err => {
          console.log(promise_err);
        });
    }
  },
  created: function() {
    this.loadSheetData();
  }
});
