let gl;
let vBuffer,vNormalBuffer,vPosition,vNormalPosition, vTextureBuffer, vTexture;

let points = [], normals = [], faceLengths = [], diffuses = [], speculars = [], texCoords=[];



let vBoxBuffer, vBoxTexture, vBoxPosition, vBoxTextureBuffer;

let maxFaces = [];

let objDrawn=0;
let objLoad=0;
let objs = [];


let stack = [];

let lightPosition = vec4(0.0, 10.0, 2.0, 1.0 );
let lightAmbient = vec4(0.2, 0.2, 0.2, 1.0 );
let lightDiffuse = vec4( 1.0, 1.0, 1.0, 1.0 );
let lightSpecular = vec4( 1.0, 1.0, 1.0, 1.0 );
let shadowMat;

let numLoaded = 0;

let eye;
let at = vec3(0.0, 0.0, 0.0);
let up = vec3(0.0, 1.0, 0.0);
let modelViewMatrix;
let projectionMatrix;
let modelViewMatrixLoc, projectionMatrixLoc;
let near = .1;
let far = 150;
let program;

let radius = 13;
let height = 13;
let theta = 0;
let spin = false;
let dashCam = false;
let dashEye;
let dashAt;
let carRadius= 3;
let cameraChange= false;
let carRotateAngle = 0;
let eyeRotateAngle = -6.20;
let atRotateAngle = -12;

let reflection = false;
let refraction = false;
let shadows = false;
let moveCar = false;
let justAmbi = 0.0;
let lightChange= false;
let skybox = false;
let skyboxLoaded=false;

let skyPoints = [
    vec4(15,15,15,1),
    vec4(15,15,-15,1), // right
    vec4(15,-15,15,1),
    vec4(15,-15,-15,1),

    vec4(-15,15,15,1),
    vec4(-15,15,-15,1),
    vec4(-15,-15,15,1), // left
    vec4(-15,-15,-15,1),

    vec4(15,15,15,1),
    vec4(15,15,-15,1), //top
    vec4(-15,15,15,1),
    vec4(-15,15,-15,1),

    vec4(15,-15,15,1),
    vec4(15,-15,-15,1), //bottom
    vec4(-15,-15,15,1),
    vec4(-15,-15,-15,1),

    vec4(15,15,-15,1), //back
    vec4(15,-15,-15,1),
    vec4(-15,15,-15,1),
    vec4(-15,-15,-15,1),

    vec4(15,15,15,1),//front
    vec4(15,-15,15,1),
    vec4(-15,15,15,1),
    vec4(-15,-15,15,1),
];

let skyTexPoints = [
    vec2(0,0),
    vec2(0,1),
    vec2(1,0),
    vec2(1,1)
];



// Get the stop sign
let stopSign = new Model(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.obj",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/stopsign.mtl");


// Get the street
let street = new Model(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.obj",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/street.mtl");

// Get the car
let car = new Model(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.obj",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/car.mtl");


// Get the lamp
let lamp = new Model(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.obj",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/lamp.mtl");

// Get the bunny (you will not need this one until Part II)
let bunny = new Model(
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.obj",
    "https://web.cs.wpi.edu/~jmcuneo/cs4731/project3/bunny.mtl");


let cubeURL= ["https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posx.png","https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negx.png","https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posy.png","https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negy.png","https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_posz.png","https://web.cs.wpi.edu/~jmcuneo/cs4731/project2/skybox_negz.png"];


function main() {


    let canvas = document.getElementById('webgl');

    window.addEventListener('keypress',onKeyPress,false);
    gl = WebGLUtils.setupWebGL(canvas, undefined);

    if (!gl) {
        console.log('Failed to get the rendering context for WebGL');
        return;
    }

    gl.viewport(0, 0, canvas.width, canvas.height);


    gl.clearColor(0.0, 0.0, 0.0, 1.0);

    gl.enable(gl.DEPTH_TEST);

    program = initShaders(gl, "vshader", "fshader");
    gl.useProgram(program);


    shadowMat= mat4();
    shadowMat[3][3] = 0;
    shadowMat[3][2] = -1/lightPosition[2];


    eye = vec3(radius,height+2);
    modelViewMatrix = lookAt(eye, at , up);
    let fovY = 50;
    projectionMatrix = perspective(fovY,1,near,far);
    modelViewMatrixLoc = gl.getUniformLocation( program, "modelViewMatrix");
    projectionMatrixLoc = gl.getUniformLocation( program, "projectionMatrix");
    gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    gl.uniformMatrix4fv(projectionMatrixLoc, false, flatten(projectionMatrix));


    gl.uniform4fv(gl.getUniformLocation(program, "lightPosition"), flatten(lightPosition));
    gl.uniform4fv(gl.getUniformLocation(program, "lightDiffuse"), flatten(lightDiffuse));
    gl.uniform4fv(gl.getUniformLocation(program, "lightSpecular"), flatten(lightSpecular));
    gl.uniform4fv(gl.getUniformLocation(program, "lightAmbient"), flatten(lightAmbient));
    gl.uniform1f(gl.getUniformLocation(program, "justAmbi"), justAmbi);


    vPosition = gl.getAttribLocation( program, "vPosition");
    vNormalPosition = gl.getAttribLocation( program, "vNormal");
    vTexture = gl.getAttribLocation( program, "vTexture");




    render();
}


let id;
function render(){
    objDrawn=0;
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    if(lightChange){
        gl.uniform1f(gl.getUniformLocation(program, "justAmbi"), justAmbi);
        lightChange=false;
    }


    if(spin){
        theta+=0.02;
        eye = vec3(radius* Math.cos(theta), height + 2 *Math.cos(theta), radius * Math.sin(theta));
        modelViewMatrix = lookAt(eye, at , up);
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
    }


    if(moveCar){
        carRotateAngle -= 0.3;
        eyeRotateAngle -= 0.3;
        atRotateAngle -= 0.3;
    }

    if(bunny.objParsed && bunny.mtlParsed && stopSign.objParsed && stopSign.mtlParsed && car.objParsed && car.mtlParsed && lamp.objParsed && lamp.mtlParsed && street.objParsed && street.mtlParsed) {
        loadObject(stopSign, "signTexture", gl.TEXTURE1, 1);
        loadObject(bunny, "bunnyTexture", gl.TEXTURE1, 1);
        loadObject(car, "carTexture", gl.TEXTURE2, 2);
        loadObject(lamp, "lampTexture", gl.TEXTURE3, 3);
        loadObject(street, "streetTexture", gl.TEXTURE4, 4);
    }


    if(skyboxLoaded === false) {
        setUpBox(cubeURL);
        initSky();
        skyboxLoaded=true;
    }

    if(bunny.generated && stopSign.generated && car.generated && lamp.generated && street.generated) {
        if (!dashCam){
            modelViewMatrix = lookAt(eye, at , up);
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            cameraChange = false;
        }
        if (dashCam){

            let dashEyeX = carRadius*Math.cos(-eyeRotateAngle*Math.PI/180);
            let dashEyeZ = carRadius*Math.sin(-eyeRotateAngle*Math.PI/180);
            let dashAtX = carRadius*Math.cos(-atRotateAngle*Math.PI/180);
            let dashAtZ = carRadius*Math.sin(-atRotateAngle*Math.PI/180);

            dashEye = vec3(dashEyeX, 1.059, dashEyeZ);
            dashAt = vec3(dashAtX, 1.045, dashAtZ)
            modelViewMatrix = lookAt(dashEye, dashAt , up);

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));



            cameraChange = false;
        }




        numLoaded = 0;
        stack.push(modelViewMatrix);
        stack.push(modelViewMatrix);
        modelViewMatrix = mult(modelViewMatrix, translate(-1,0,4.25));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        drawSign();

        modelViewMatrix=stack.pop();



        stack.push(modelViewMatrix);
        stack.push(modelViewMatrix);

        modelViewMatrix = mult(modelViewMatrix, rotateY(carRotateAngle));
        stack.push(modelViewMatrix);


        modelViewMatrix = mult(modelViewMatrix, translate(carRadius,0.68,1.85));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        drawBunny();




        modelViewMatrix = stack.pop();
        modelViewMatrix =  mult(modelViewMatrix,translate(carRadius,0,0));
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        drawCar();



        modelViewMatrix = stack.pop();
        modelViewMatrix = stack.pop();

        modelViewMatrix=stack.pop();
        gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        drawLamp();
        drawStreet();


        if (skybox) drawSky();


    }
    id = requestAnimationFrame(render);
}

function loadObject(object, textureName, textureNum, numTexture){
    if(!object.generated) {
        objs.push(object);

        for (let i = 0; i < object.faces.length; i++) {
            let face = object.faces[i];
            for (let j = 0; j < face.faceVertices.length; j++) {
                points.push(face.faceVertices[j]);
                normals.push(face.faceNormals[j]);
                if (object.textured)
                    texCoords.push(face.faceTexCoords[j]);
            }
            let currentDiffuse = object.diffuseMap.get(face.material);
            let currentSpecular = object.specularMap.get(face.material);
            faceLengths.push(face.faceVertices.length);
            diffuses.push(vec4(currentDiffuse[0], currentDiffuse[1], currentDiffuse[2], currentDiffuse[3]));
            speculars.push(vec4(currentSpecular[0], currentSpecular[1], currentSpecular[2], currentSpecular[3]));
        }
        if(object.textured){
            configTexture(object.imagePath, textureName, textureNum, numTexture);
        }

        object.generated = true;
        objLoad ++;
        if (maxFaces.length === 0)
            maxFaces[0] = object.faces.length;
        else
            maxFaces.push(object.faces.length + maxFaces[maxFaces.length - 1]);
        if (objLoad === 5) {
            setBuffers();
        }
    }
}

function draw(object){
    if(objs[object].textured)
        gl.uniform1f(gl.getUniformLocation(program,"textured"),1.0);
    else
        gl.uniform1f(gl.getUniformLocation(program,"textured"),0.0);

    for (let i = numLoaded; i < maxFaces[object]; i++) {


        gl.uniform4fv(gl.getUniformLocation(program, "diffuse"), flatten(diffuses[i]));
        gl.uniform4fv(gl.getUniformLocation(program, "specular"), flatten(speculars[i]));


        if((object===0 || object === 2) && shadows && !justAmbi){
            stack.push(modelViewMatrix);
            gl.uniform1f(gl.getUniformLocation(program,"flag"),8.0);

            let modelMatrix = translate(lightPosition[0],lightPosition[1],lightPosition[2]);
            modelMatrix = mult(modelMatrix, shadowMat);
            modelMatrix = mult(modelMatrix, translate(-lightPosition[0],-lightPosition[1],-lightPosition[2]));
            modelViewMatrix = mult(modelViewMatrix,modelMatrix);

            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
            gl.drawArrays(gl.TRIANGLES, objDrawn, faceLengths[i]);


            gl.uniform1f(gl.getUniformLocation(program,"flag"),(object+1)*1.0);
            modelViewMatrix = stack.pop();
            gl.uniformMatrix4fv(modelViewMatrixLoc, false, flatten(modelViewMatrix));
        }
        if(reflection && object === 2){
            gl.uniform1f(gl.getUniformLocation(program,"flag"),6.0);
        }
        if(refraction && object === 1) {
            gl.uniform1f(gl.getUniformLocation(program, "flag"), 7.0);
        }

        gl.drawArrays(gl.TRIANGLES, objDrawn, faceLengths[i]);
        objDrawn += faceLengths[i];
    }
    numLoaded = maxFaces[object];
}


function drawSign(){
    gl.uniform1f(gl.getUniformLocation(program,"flag"),1.0);
    draw(0);
}

function drawBunny(){
    gl.uniform1f(gl.getUniformLocation(program,"flag"),2.0);
    draw(1);
}

function drawCar(){
    gl.uniform1f(gl.getUniformLocation(program,"flag"),3.0);
    draw(2);
}

function drawLamp(){
    gl.uniform1f(gl.getUniformLocation(program,"flag"),4.0);
    draw(3);
}

function drawStreet(){
    gl.uniform1f(gl.getUniformLocation(program,"flag"),5.0);
    draw(4);
}


function setBuffers(){
    vBuffer = gl.createBuffer();
    vNormalBuffer = gl.createBuffer();
    vTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(points), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vPosition);
    gl.bindBuffer(gl.ARRAY_BUFFER, vNormalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(normals), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vNormalPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vNormalPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, vTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(texCoords), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vTexture, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vTexture);
}




function setUpBox(urls){
    let imgs = [];
    for(let i=0; i<urls.length; i++){
        let image = new Image();
        image.crossOrigin="";
        image.src=urls[i];

        image.onload = function() {
            imgs.push(image);
            if(imgs.length===urls.length){

                let cubeMap = gl.createTexture();
                gl.activeTexture(gl.TEXTURE10);
                gl.bindTexture(gl.TEXTURE_CUBE_MAP, cubeMap);

                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[0]);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_X, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[1]);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[2]);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[3]);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_POSITIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[4]);
                gl.texImage2D(gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, imgs[5]);

                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

                gl.uniform1i(gl.getUniformLocation(program, "cube"), 10);
            }
        }
    }

}






function onKeyPress(event){
    if(event.key === 'c' || event.key === 'C'){
        spin = !spin;
    }
    else if(event.key === 'l' || event.key === 'L'){
        lightChange=true;
        justAmbi = 1-justAmbi;
    }
    else if(event.key === 's' || event.key === 'S'){
        shadows = !shadows;
    }
    else if(event.key === 'f' || event.key === 'F') {
        refraction = !refraction;
    }
    else if(event.key === 'm' || event.key === 'M'){
        moveCar = !moveCar;
    }
    else if(event.key === 'd' || event.key === 'D'){
        dashCam = !dashCam;
    }
    else if(event.key === 'r' || event.key === 'R'){
        reflection = !reflection;
    }
    else if(event.key === 'e' || event.key === 'E'){
        skybox = !skybox;
    }
}

function configTexture(imageURL, name, textureNum, numTexture){
    let image = new Image();
    image.crossOrigin="";
    image.src=imageURL;
    image.onload = function() {
        let tex = gl.createTexture();
        gl.activeTexture(textureNum|1);
        gl.bindTexture(gl.TEXTURE_2D,tex);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);

        gl.uniform1i(gl.getUniformLocation(program,name), numTexture);
    }

}



function drawSky(){
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),1.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),2.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 4, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),3.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 8, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),4.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 12, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),5.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 16, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),6.0);
    gl.drawArrays(gl.TRIANGLE_STRIP, 20, 4);
    gl.uniform1f(gl.getUniformLocation(program,"skyFlag"),0.0);
}



function initSky(){

    vBoxPosition = gl.getAttribLocation( program, "vBoxPosition");
    vBoxTexture = gl.getAttribLocation( program, "vBoxTexture");
    vBoxBuffer = gl.createBuffer();
    vBoxTextureBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vBoxBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skyPoints), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vBoxPosition, 4, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vBoxPosition);

    gl.bindBuffer(gl.ARRAY_BUFFER, vBoxTextureBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, flatten(skyTexPoints), gl.STATIC_DRAW);

    gl.vertexAttribPointer(vBoxTexture, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(vBoxTexture);


    configTexture(cubeURL[0],"rightTexture",gl.TEXTURE7, 7);
    configTexture(cubeURL[1],"leftTexture",gl.TEXTURE31, 31);
    configTexture(cubeURL[2],"upTexture",gl.TEXTURE9, 9);
    configTexture(cubeURL[3],"downTexture",gl.TEXTURE15, 15);
    configTexture(cubeURL[4],"forwardTexture",gl.TEXTURE4, 4);
    configTexture(cubeURL[5],"backTexture",gl.TEXTURE17, 17);
}

