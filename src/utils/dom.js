export function dom(object) {
  const config = object.departments;
  for ( let depto in config ) {

    let parent = document.getElementById(depto);
    let dep = parent.getElementsByTagName('path')[0] || parent.getElementsByTagName('polygon')[0]
    
    // TODO: Refactor this 
    dep.setAttribute('class', config[depto].class);
    dep.setAttribute('fill', config[depto].fill);

  }

}