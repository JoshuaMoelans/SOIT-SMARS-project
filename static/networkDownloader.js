/*
  classes to hold the blocks for easier processing
 */

class BlockHolder {
  constructor(divID,divClass,blockType){
    this.divID = divID;
    this.divClass = divClass;
    this.blockType = blockType;
  }
}

class ParamBlockHolder extends BlockHolder{
  constructor(divID,divClass,blockType,param) {
    super(divID,divClass,blockType);
    this.param = param;
    this.paramType = typeof(param);
  }
}
/*
  Functions to download the network by generating a code file
 */
function downloadNetwork(){
  let startCounter = 0;
  let startBlockID = null;
  let startBlock = null;
  $('#network > div').each(function(){
    const innerDivID = $(this).attr('id');
    const innerDivClass = $(this).attr('class');
    const blockType = $(this).children()[0].innerHTML;
    if(blockType === 'Start Block'){
      startCounter += 1;
      startBlockID = innerDivID;
      startBlock = new BlockHolder(innerDivID,innerDivClass,blockType)
    }
  })
  if(startCounter > 1){
    alert('multiple start blocks!');
  }else if(startCounter < 1){
    alert('no start block found!');
  }else{
    let data = generateFile(startBlock);
    let datestring = generateDate();
    downloadFile(`myCode${datestring}.ino`, data);
  }
}

function generateDate(){
  let currentDate = new Date();
  let outString = "" + currentDate.getFullYear()
  outString += `${currentDate.getMonth()+1}`
  outString += `${currentDate.getDay()}`
  outString += `T${currentDate.getHours()}`
  outString += `${currentDate.getMinutes()}`
  outString += `${currentDate.getSeconds()}`
  return outString
}

function codeForBlock(block){
  switch (block.blockType) {
    case "Start Block":
      return ""
    case "Drive Forward":
      return "\tR_motor.run(FORWARD);\n" +
          "\tL_motor.run(FORWARD);\n"
    case "Drive Backward":
      return "\tR_motor.run(BACKWARD);\n" +
          "\tL_motor.run(BACKWARD);\n"
    case "Set speed to":
      let speed = Math.min(block.param,255)
      return `\tR_motor.setSpeed(${speed});\n`
          +`\tL_motor.setSpeed(${speed});\n`
    case "Wait for sec":
      let delay_seconds = block.param*1000
      return `\tdelay(${delay_seconds});`
    case "Stop both motors":
      return "\tR_motor.run(RELEASE);\n" +
          "\tL_motor.run(RELEASE); \n"
    case "End program":
      return "\tR_motor.run(RELEASE);\n" +
          "\tL_motor.run(RELEASE); \n"+
          "\twhile(1){}"
    default:
      return `\t//block ${block.blockType} not recognized`
  }
}

/*
  a list of all blocks which are expected to have parameters
  TODO document this well!!!
 */
let ParamBlocks = ['Set speed to','Wait for sec']

function networkToCode(startBlock){
  let output = ""
  let network = [startBlock]
  let currentBlock = document.getElementById(startBlock.divID)
  // we loop until we find an unfilled dropzone (or end-block which has no dropzone)
  while(currentBlock.querySelector(".dropzone-filled")){
    currentBlock = currentBlock.lastChild
    const innerDivID = $(currentBlock).attr('id');
    const innerDivClass = $(currentBlock).attr('class');
    const blockType = $(currentBlock).children()[0].innerText;
    if(ParamBlocks.includes(blockType)){
      let param = $(currentBlock).children()[0].children[0].value
      if(!param){ // if param field is not filled in, we use the placeholder default value
        param = $(currentBlock).children()[0].children[0].placeholder
      }
      // check if param is number type: if yes, we can parse it as an integer
      if(!isNaN(param)){
        param = parseInt(param)
      }
      network.push(new ParamBlockHolder(innerDivID,innerDivClass,blockType,param))
    }else{
      network.push(new BlockHolder(innerDivID,innerDivClass,blockType))
    }
  }
  // for each added network block we generate the code
  for(let block of network){
    output += codeForBlock(block) + "\n"
  }
  return output
}

function generateFile(startBlock){
  let fileContent = ""
  let data = networkToCode(startBlock)
  // necessary setup for any Arduino SMARS file
  fileContent = "#include <AFMotor.h>\n" +
      "\n" +
      "AF_DCMotor R_motor(1);\n" +
      "AF_DCMotor L_motor(2); \n\n" +
      "void setup() {\n" +
      "  R_motor.setSpeed(100);\n" +
      "  L_motor.setSpeed(100);\n" +
      "} \n\n" +
      `void loop() {\n${data} \n }`
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