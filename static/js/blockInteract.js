// This stores the position of all draggable (=cloned) items
let positions = Array()
// We keep track of the number of blocks
let blockCounter = 0;
// and we have a stack of trash
let trash = [];

interact(".itemSidebar")
  .draggable({
    // By setting manualStart to true - we control the manualStart.
    // We need to do this so that we can clone the object before we begin dragging it.
    manualStart: true,
    listeners: {
      move(event) {
        const {currentTarget,interaction} = event;
        const itemID = currentTarget.id;
        if(itemID){
          positions[itemID].x += event.dx;
          positions[itemID].y += event.dy;
          event.target.style.transform = `translate(${positions[itemID].x}px, ${positions[itemID].y }px)`;
        }
      }
    }
  })
  // This only gets called when we trigger it below using interact.start(...)
  .on("move", function(event) {
    const { currentTarget, interaction } = event;
    let element = currentTarget;
    // If we are dragging an item from the sidebar, its transform value will be ''
    // We need to clone it, and then start moving the clone
    if (
      interaction.pointerIsDown &&
      !interaction.interacting() &&
      currentTarget.style.transform === ""
    ) {
      element = currentTarget.cloneNode(true);

      // Add absolute positioning so that cloned object lives right on top of the original object
      element.style.position = "absolute";
      element.style.left = 0;
      element.style.top = 0;

      // Add the cloned object to the document
      const container = document.querySelector(".container");
      container && container.appendChild(element);
      let parentType = currentTarget.className.split(" ")[1];
      element.id = blockCounter.toString();
      document.getElementById(blockCounter.toString()).className += " itemclone" + parentType;
      // set new nodes to be children of network div
      document.getElementById("network").appendChild(element);
      // create control flow dropzone element if control-flow block
      if(element.classList.contains('control-flow')){
        let controlDropzone = document.createElement('div');
        controlDropzone.setAttribute('class','dropzone control');
        controlDropzone.setAttribute('id',`control-${blockCounter}`);
        controlDropzone.style.transform = `translate(30px,0px)`;
        element.appendChild(controlDropzone);
      }
      // create dropzone if element allows for it - done via no-dropzone class
      if(!(element.classList.contains('no-dropzone'))){
        let dropzone = document.createElement('div');
        dropzone.setAttribute('class','dropzone');
        dropzone.setAttribute('id',`dropzone-${blockCounter}`)
        element.appendChild(dropzone);
      }
      if(element.classList.contains('has-input')){
        // enable input field for cloned block
        let inField = element.querySelector('input');
        inField.disabled = false;
      }
      blockCounter += 1

      // Add new position in array
      const position = {x:0,y:0}
      const { offsetTop, offsetLeft } = currentTarget;
      position.x = offsetLeft;
      position.y = offsetTop;
      positions.push(position);
      // If we are moving an already existing item, we need to make sure the position object has
      // the correct values before we start dragging it
    } else if (interaction.pointerIsDown && !interaction.interacting()) {
      const regex = /translate\(([\d]+)px, ([\d]+)px\)/i;
      const transform = regex.exec(currentTarget.style.transform);
      const itemID = currentTarget.id
      if (transform && transform.length > 1) {
        positions[itemID].x = Number(transform[1]);
        positions[itemID].y = Number(transform[2]);
      }
    }
    // Deletion of object - only if itemclone class is attached
    window.oncontextmenu = function (e) {
      let target = e.target
      if(target.className === 'blockBoxBar' || target.classList.contains('dropzone')){
        // prevent default behaviour when right-clicking canvas or dropzone
        e.preventDefault();
        return;
      }
      while(target.className.search('itemclone') === -1){ // search up until itemclone parent is found
        if((target.classList.contains('container'))){ // or stop when container is reached (should not happen)
          e.preventDefault();
          return;
        }
        target = target.parentElement;
      }
      // remove dropzone-filled class tag from parent dropzone
      target.parentElement.querySelector('.dropzone').classList.remove('dropzone-filled');
      target.remove();
      e.preventDefault() // prevents drop-down menu for right-click
    }
    // Start the drag event
    // TODO make drag event only start when interacting with block instead of allowing dropzone too
    //  tags: front-end, enhancement
    interaction.start({ name: "drag" }, event.interactable, element);
    // Extra feature - bounce back if trying to drop block outside screen width
    // todo: fix bounce-back not working 100% of the time → drag back and forth gets you over the threshold
    let w = element.getBoundingClientRect().width
    let itemID = element.id;
    if(itemID){ // only if itemID exists; basic sidebar blocks do not have an id, and also have no position stored
      const position = positions[itemID]
      if(position.x+w >= window.innerWidth){
          position.x = window.innerWidth-w-5
      }
    }
    // we store items to the bin for retrieval, when deleting on accident
    let bin = document.getElementById("bin");
    if(itemID && isCollide(bin,element)){
      trash.push(element);
      element.remove();
    }
  });

/**
 * restores trash after click on undo button
 * gets trash from stack (LiFo order) and puts it top left of the screen
 */
function restoreTrash(){
  if(trash.length){
    let retrieved = trash.pop()
    document.getElementById("network").appendChild(retrieved);
    retrieved.style.transform = "translate(250px,100px)";
  }
}

/**
 * dropzone interaction code
 */
interact('.dropzone').dropzone({
  // only accept elements matching this CSS selector
  accept: '.can-drop',
  // Require a 15% element overlap for a drop to be possible
  // TODO fix stretched control flow not having 0.15% overlap when enlarged
  overlap: 0.15,

  // listen for drop related events:
  /**
   * when a drop in a dropzone happens; NOT if dropping outside of a dropzone!
   * @param event
   */
  ondropactivate: function (event) {
    // add active dropzone feedback - only if dropzone not filled
    if(event.target.classList.contains('dropzone-filled')){
      return
    }
    event.target.classList.add('drop-active')
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget
    var dropzoneElement = event.target

    // feedback the possibility of a drop - only if not dropping in own dropzone!
    let current = dropzoneElement
    while(current !== document.getElementById('network')){
      if(current === draggableElement){
        return
      }
      current = current.parentElement;
    }
    // check if dropzone is filled already
    if(dropzoneElement.classList.contains('dropzone-filled')){
      return
    }
    draggableElement.classList.add('can-drop')
    dropzoneElement.classList.add('drop-target')
  },
  /**
   * when an element leaves the dropzone it was in, either after being part of the drop zone or just after hovering
   * @param event
   */
  ondragleave: function (event) {
    // TODO fix removing flow-in-flow nesting not properly updating the in-control class
    //  references behaviour on repeat-in-repeat removal not resetting the dropzone the inner repeat was in as well
    // remove the drop feedback style
    let network = document.getElementById('network');
    let draggedBlock = document.getElementById(event.relatedTarget.id);
    let getPosFromParent = false;
    if(event.target.parentElement === draggedBlock){
      // in case we leave our own drop zone, we can return if we're not a control-flow block
      // else we have to check if we are part of a dropzone or not, and then we can still update our parent's dropzone
      if(draggedBlock.classList.contains("control-flow")){
        if(draggedBlock.parentElement !== network){
          let parentDropzone = $(`#dropzone-${draggedBlock.parentElement.id}`)[0];
          parentDropzone.classList.remove('drop-target');
          parentDropzone.classList.remove('dropzone-filled');
          getPosFromParent = true;
        }
      }else{
        return
      }
    }
    event.target.classList.remove('drop-target')
    if(draggedBlock.parentElement !== network){
      // prevent teleporting blocks as referenced in issues #14 and #20
      // TODO smoother x-position transform
      // when moving block outside of current drop-zone, it snaps to dropzone parent's X position
      // already spend too much time on getting it close enough, so only implementing this if time allows for it
      // tags: enhancement, front-end
      draggedBlock.style.transform = event.target.parentElement.style.transform
      positions[draggedBlock.id] = {...positions[event.target.parentElement.id]}
      if(getPosFromParent){
        positions[draggedBlock.id] = {...positions[draggedBlock.parentElement.id]}
      }
      positions[draggedBlock.id].y += 50
      event.target.classList.remove('dropzone-filled')
      // if block was part of a control flow network, we up the dropzone again
      if(draggedBlock.classList.contains("flowBlock")){
        let updateControlBlocks = []
        let controlLine = draggedBlock.classList[draggedBlock.classList.length - 1];
        let allClassNames = draggedBlock.className.split(' ')
        for(let className of allClassNames){
          if(className.includes('in-control-')){
            draggedBlock.classList.remove("flowBlock")
            draggedBlock.classList.remove(className);
            updateControlBlocks.push(className.split('-')[2])
            updateChildrenControl(draggedBlock,controlLine);
          }
        }
        for(let id of updateControlBlocks){
          updateDropZone(id);
        }
      }
    }
    network.appendChild(draggedBlock);
  },
  /**
   * when element is dropped in a dropzone
   * @param event
   */
  ondrop: function (event) {
    // sets parent of currently dropped block to be the dropzone's accompanying block
    if(event.target.classList.contains('dropzone-filled')){
      return
    }
    let newParentID = event.target.id.split('-')[1];
    let newParent = document.getElementById(newParentID);
    let draggedBlock = document.getElementById(event.relatedTarget.id);
    // make sure we don't drop into itself or own child element
    let current = newParent
    while(current !== document.getElementById('network')){
      if(current === draggedBlock){
        return
      }
      current = current.parentElement
    }
    newParent.appendChild(draggedBlock);
    event.target.classList.add('dropzone-filled');
    // snap block to parent position
    let yVal = "30";
    let xVal = "0";
    let lowerDropzone = false;
    let controlParentID = [];
    // check if dropzone is a  child of control-flow block (example: Repeat)
    if(newParent.classList.contains('control-flow')) {
      if (!event.target.classList.contains("control")) { // if we're dropping under the control zone
        let controlSize = $(`.in-control-${newParentID}`).length;
        yVal = `${(controlSize + 2) * 30}`;
      } else {
        draggedBlock.classList.add(`flowBlock`);
        draggedBlock.classList.add(`in-control-${newParentID}`);
        updateChildrenControl(draggedBlock,`in-control-${newParentID}`,false);
        xVal = "25";  // if we're dropping in the control zone there's a slight shift to the right
        lowerDropzone = true;
        controlParentID = [newParentID];
      }
    }
      // if dropzone is itself child of in-control block, dropped block must be in-control too
      if(newParent.classList.contains(`flowBlock`)){
        let allClassNames = newParent.className.split(' ');
        for(let className of allClassNames){
          if(className.includes('in-control-')){
            draggedBlock.classList.add("flowBlock");
            draggedBlock.classList.add(className);
            controlParentID.push(className.split('-')[2]);
            updateChildrenControl(draggedBlock,className,false);
          }
        }
        lowerDropzone = true;
      }
      // if parent of target element is in-control, we want to move the control-flow parent's dropzone by 20px
      if (lowerDropzone) {
        for(let id of controlParentID){
          updateDropZone(id)
        }
      }
    draggedBlock.style.transform = `translate(${xVal}px,${yVal}px)`;
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active')
    event.target.classList.remove('drop-target')
  }
})

/**
 * update the dropzone of the given control flow ID block by searching for all items in its control group
 * and scaling the height accordingly
 * @param controlFlowID - the ID of the control group block
 */
function updateDropZone(controlFlowID){
      let underControlDropZone = document.getElementById(`dropzone-${controlFlowID}`);
      let controlGroup = $(`.in-control-${controlFlowID}`);
      let nestedFlowCount = 0;
      controlGroup.each(function(i,obj){
        if(obj.classList.contains('control-flow')){
          nestedFlowCount += 1;
        }
      });
      let controlSize = controlGroup.length + nestedFlowCount;
      // we move the dropzone according to the amount of items in the control-flow
      underControlDropZone.style.transform = `translate(0px,${30*controlSize}px)`;
      // and we set the height of the control flow element
      underControlDropZone.parentElement.style.height = `${30*(2+controlSize)}px`;
      let controlZoneChildren = underControlDropZone.parentElement.children;
      for(let child of controlZoneChildren){
        if(!child.classList.contains("flowBlock") && child.classList.contains("itemSidebar")){
          child.style.transform = `translate(0px,${30*(2+controlSize)}px)`;
        }
      }
}

/**
 * function that recursively updates children of dragged block to remove/add them from/to the control flow
 * @param draggedBlock - the initial block being dragged into/out of the control flow
 * @param controlLine - the control line class to remove/add from the children classlist
 * @param remove - whether to remove or add the class
 */
function updateChildrenControl(draggedBlock, controlLine,remove=true) {
  let currentblock = draggedBlock;
  // weird while-structure because of 'End' block having invisible #text node as lastChild (which has no classList)
  while(currentblock.lastChild.classList){
    currentblock = currentblock.lastChild;
    // proper while-break check done after being sure classList exists
    if(!currentblock.classList.contains('itemSidebar')){
      break;
    }
    if(remove){
      currentblock.classList.remove(controlLine);
      // only remove flowBlock if block does not have other control line(s)
      if(!hasControlLine(currentblock.classList)){
        currentblock.classList.remove('flowBlock');
      }
    }else{
      currentblock.classList.add(controlLine);
      currentblock.classList.add('flowBlock');
    }
  }
}

function hasControlLine(classList){
  for(let classname of classList){
    if(classname.includes('in-control')){
      return true;
    }
  }
  return false;
}

/**
 * simple collide check function
 * retrieved from https://stackoverflow.com/questions/2440377/javascript-collision-detection
 * @param a - first element for collision detection
 * @param b - second element for collision detection
 * @returns {boolean} - whether the two objects collide or not
 */
function isCollide(a, b) {
    let aRect = a.getBoundingClientRect();
    let bRect = b.getBoundingClientRect();

    return !(
        ((aRect.top + aRect.height) < (bRect.top)) ||
        (aRect.top > (bRect.top + bRect.height)) ||
        ((aRect.left + aRect.width) < bRect.left) ||
        (aRect.left > (bRect.left + bRect.width))
    );
}