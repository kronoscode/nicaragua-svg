const injectSvg = require('svg-injector');

class NicSvg {
    constructor(svgElem, jsonPath) {
        this.svgElem = svgElem;
        this.jsonPath = jsonPath;
    }

    svgToDom() {
        return injectSvg(document.getElementById(this.svgElem));
    }

}

export {NicSvg}
