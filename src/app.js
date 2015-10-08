import {NicSvg} from './model/nic-svg';

global.app = function (element, config_path) {
    var nicaragua = new NicSvg(element, config_path);
    nicaragua.svgToDom();
};