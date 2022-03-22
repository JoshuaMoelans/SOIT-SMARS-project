function onDragStart(event){
    event
        .dataTransfer
        .setData('text/plain', event.target.id);

    event
        .currentTarget
        .style
        .backgroundColor = "yellow"
}

function onDragEnd(event){
        event
        .currentTarget
        .style
        .backgroundColor = "#4AAE9B"
}

function onDragOver(event){
    event.preventDefault();
}

function onDrop(event){
    event.preventDefault(); // prevents redirect to draggable id as URL
    const id = event
        .dataTransfer
        .getData('text');
    const draggableElement = document.getElementById(id);
    const dropzone = event.target;
    dropzone.appendChild(draggableElement);

    event
        .dataTransfer
        .clearData();
}