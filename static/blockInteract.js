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
      let dropzone = document.createElement('div');
      dropzone.setAttribute('class','dropzone');
      dropzone.setAttribute('id',`dropzone-${blockCounter}`)
      element.appendChild(dropzone);
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
    // todo: fix right-click after dragging; currently removes last moved block
    // TODO fix right-click removing absolutely everything
    window.oncontextmenu = function (e) {
      if(currentTarget.className.search("itemclone") !== -1){
        currentTarget.remove()
      }
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
  accept: '*',
  // Require a 75% element overlap for a drop to be possible
  overlap: 0.50,

  // listen for drop related events:

  ondropactivate: function (event) {
    // add active dropzone feedback
    event.target.classList.add('drop-active')
  },
  ondragenter: function (event) {
    var draggableElement = event.relatedTarget
    var dropzoneElement = event.target

    // feedback the possibility of a drop
    dropzoneElement.classList.add('drop-target')
    draggableElement.classList.add('can-drop')
  },
  ondragleave: function (event) {
    // remove the drop feedback style
    event.target.classList.remove('drop-target')
    event.relatedTarget.classList.remove('can-drop')
  },
  ondrop: function (event) {
    console.log(event.target.id);
    console.log(event.relatedTarget.id);
    // sets parent of currently dropped block to be the dropzone's accompanying block
    let newParentID = event.target.id.split('-')[1];
    let newParent = document.getElementById(newParentID);
    let draggedBlock = document.getElementById(event.relatedTarget.id);
    newParent.appendChild(draggedBlock);
    draggedBlock.style.transform = "translate(0px,33px)";
  },
  ondropdeactivate: function (event) {
    // remove active dropzone feedback
    // TODO remove block from parent node (move back to global network)
    event.target.classList.remove('drop-active')
    event.target.classList.remove('drop-target')
  }
})

function downloadNetwork(){
  let startCounter = 0;
  let startBlockID = null;
  let network = {}
  $('#network > div').each(function(){
    const innerDivID = $(this).attr('id');
    const innerDivClass = $(this).attr('class');
    const blockStyle = innerDivClass.split(' ')[1];
    const blockType = $(this).children()[0].innerHTML;
    network[innerDivID] = ({id: innerDivID, type: blockType})
    if(blockType === 'Start Block'){
      startCounter += 1;
      startBlockID = innerDivID;
    }
  })
  if(startCounter > 1){
    alert('multiple start blocks!');
    return
  }else if(startCounter < 1){
    alert('no start block found!');
    return
  }
  let data = generateFile(network)
  downloadFile('myCode.py', data)
}

function generateFile(network){
  let fileContent = ""
  let data = JSON.stringify(network)
  fileContent = `if __name__ == \'__main__\': \n\tprint(\'${data}\')`
  return fileContent
}

function downloadFile(filename, content){
  let element = document.createElement('a');
  element.setAttribute('href','data:text/plain;charset=utf-8,' + encodeURIComponent(content));
  element.setAttribute('download',filename)
  element.style.display = 'none';
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}