const injectSvg = require('svg-injector');

import { get } from '../utils/get.js';
import { dom } from '../utils/dom.js';

class NicSvg {

    constructor(svgElem, jsonPath) {
        this.svgElem = svgElem;
        this.jsonPath = jsonPath;
    }

    getJSON(url = this.jsonPath) {
      return get(url)
      .then(function(config) {
        return dom(JSON.parse(config));
      })
      .catch(function(err) {
        console.log("getJSON failed for", url, err);
        throw err;
      });
    }

    svgToDom() {
      let _this = this;
      return injectSvg(
              document.getElementById(this.svgElem),
              { evalScripts: 'once' },
              function () {
                // call getJSON once all the requested 
                // SVG elements have been injected.
                _this.getJSON();
              }
            );
    }

    build() {
      this.svgToDom();
    }

}

export {NicSvg}
