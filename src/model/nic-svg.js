const injectSvg = require('svg-injector');

import { get } from '../util/utils.js';

class NicSvg {
    constructor(svgElem, jsonPath) {
        this.svgElem = svgElem;
        this.jsonPath = jsonPath;
    }

    svgToDom() {
        return injectSvg(document.getElementById(this.svgElem));
    }

    getJSON(url = this.jsonPath) {
      return get(url)
      .then(function() {
        return JSON.parse(url);
      })
      .catch(function(err) {
        console.log("getJSON failed for", url, err);
        throw err;
      });
    }

    build() {
      this.getJSON();
      this.svgToDom();
    }

}

export {NicSvg}
