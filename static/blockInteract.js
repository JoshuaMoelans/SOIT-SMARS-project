// This stores the position of all draggable (=cloned) items
let positions = Array()
// We keep track of the number of blocks
let blockCounter = 0;

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
          // console.log(itemID)
          // console.log(event.target.style.transform)
          // console.log(positions[itemID])
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
  });

interact('.dropzone').dropzone({
  // only accept elements matching this CSS selector
  accept: '.can-drop',
  // Require a 50% element overlap for a drop to be possible
  overlap: 0.25,

  // listen for drop related events:

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
  ondragleave: function (event) {
    // remove the drop feedback style
    let network = document.getElementById('network');
    let draggedBlock = document.getElementById(event.relatedTarget.id);
    if(event.target.parentElement === draggedBlock){
      return
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
      positions[draggedBlock.id].y += 50
      event.target.classList.remove('dropzone-filled')
    }
    network.appendChild(draggedBlock);
  },
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
    event.target.classList.add('dropzone-filled')
    // snap block to parent
    draggedBlock.style.transform = "translate(0px,40px)";
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    event.target.classList.remove('drop-active')
    event.target.classList.remove('drop-target')
  }
})