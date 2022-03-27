// This stores the position of the current item being dragged
const position = { x: 0, y: 0 };

// TODO blocks 'swapping' positions when dragging one after another
// When moving two different blocks, dragging the second one seems to teleport it onto the first one's place.
// labels: bug,front-end

interact(".itemSidebar")
  .draggable({
    // By setting manualStart to true - we control the manualStart.
    // We need to do this so that we can clone the object before we begin dragging it.
    manualStart: true,
    listeners: {
      move(event) {
        position.x += event.dx;
        position.y += event.dy;
        event.target.style.transform = `translate(${position.x}px, ${position.y}px)`;
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
      let parentType = currentTarget.className.split(" ")[1]
      element.id = "newElem"
      document.getElementById("newElem").className += " itemclone" + parentType;
      element.id = ""


      const { offsetTop, offsetLeft } = currentTarget;
      position.x = offsetLeft;
      position.y = offsetTop;
      // If we are moving an already existing item, we need to make sure the position object has
      // the correct values before we start dragging it
    } else if (interaction.pointerIsDown && !interaction.interacting()) {
      const regex = /translate\(([\d]+)px, ([\d]+)px\)/i;
      const transform = regex.exec(currentTarget.style.transform);
      if (transform && transform.length > 1) {
        position.x = Number(transform[1]);
        position.y = Number(transform[2]);
      }
    }
    // Deletion of object - only if itemclone class is attached
    // todo: fix right-click after dragging; currently removes last moved block
    window.oncontextmenu = function (e) {
      if(currentTarget.className.search("itemclone") !== -1){
        currentTarget.remove()
      }
      e.preventDefault() // prevents drop-down menu for right-click
    }
    // Start the drag event
    interaction.start({ name: "drag" }, event.interactable, element);
    // bounce back if trying to drop block outside screen width
    // todo: fix bounce-back not working 100% of the time → drag back and forth gets you over the threshold
    let w = element.getBoundingClientRect().width
    if(position.x+w >= window.innerWidth){
      position.x = window.innerWidth-w-5
    }
  });