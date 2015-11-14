export function dom(object) {
  const config = object.departments;
  for ( let depto in config ) {

    let parent = document.getElementById(depto);

    parent.setAttribute('xlink:href', config[depto].link)
    parent.setAttribute('target', config[depto].target)

    let dep = parent.getElementsByTagName('path')[0] || parent.getElementsByTagName('polygon')[0]
    
    // TODO: Refactor this 
    dep.setAttribute('class', config[depto].class);
    dep.setAttribute('fill', config[depto].fill);
    dep.setAttribute('stroke', config[depto].stroke)
    dep.setAttribute('stroke-width', config[depto].stroke_width)


  }

}