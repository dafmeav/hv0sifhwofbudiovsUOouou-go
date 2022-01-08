
var game = {}
var screen = {}

// ボールの描画
function drawBall() {
    screen.ctx.beginPath();
    screen.ctx.arc(screen.canvas.width*game.ballXHS, screen.canvas.height*game.ballYVS, screen.canvas.width*game.ballRadiusHS, 0, Math.PI*2);
    screen.ctx.fillStyle = "#0025DD";
    screen.ctx.fill();
    screen.ctx.closePath();
}

// パドルの描画
function drawPaddle() {
    screen.ctx.beginPath();
    screen.ctx.rect(
        screen.canvas.width*game.paddleXHS,
        screen.canvas.height*game.paddleYVS,
        screen.canvas.width*game.paddleWidthHS,
        screen.canvas.height*game.paddleHeightVS
    );
    screen.ctx.fillStyle = "#0095DD";
    screen.ctx.fill();
    screen.ctx.closePath();
}

// ブロックの描画
function drawBlocks() {
    for(var y = 0; y<game.blocksNum.y; y++){
        for(var x = 0; x<game.blocksNum.x; x++){
            if(game.blocks[y][x].available == false) continue;
            screen.ctx.beginPath();
            var margin = game.blocksMarginHS * screen.canvas.width
            screen.ctx.rect(
                game.blocks[y][x].xHS * screen.canvas.width + margin,
                game.blocks[y][x].yVS * screen.canvas.height + margin,
                game.blocks[y][x].widthHS * screen.canvas.width - margin,
                game.blocks[y][x].heightVS * screen.canvas.height - margin
            );
            screen.ctx.fillStyle = "#aaaaaa";
            screen.ctx.fill();
            screen.ctx.closePath();
        }
    }
}

// ボールが取りこぼされた時の処理を行う
function pickFallenBall(){
    set_ball()
}

// すべてのブロックが破壊されたときの処理を行う
function completeCallback(){
    console.log("Congratulations!")
}

// ブロックを破壊する
function breakBlock(x, y){
    game.blocks[y][x].available = false

    // すべてのブロックが破壊されたかを判定する
    var allBlockBroken = true
    for(var y = 0; y<game.blocksNum.y; y++){
        for(var x = 0; x<game.blocksNum.x; x++){
            allBlockBroken = allBlockBroken && (game.blocks[y][x].available == false)
        }
    }
    if(allBlockBroken == true) {
        completeCallback()
    }

}

// ブロックを動かす
function moveBall(){

    var NextBallXHS = 0.0
    var NextBallYVS = 0.0
    var NextBallAngle = game.ballAngle
    var MaxCollisionDistanceScale = 10.0
    var brokenBlocksList = []

    var AngleList = [ 0.0, -game.ballAngle*2, Math.PI-game.ballAngle*2, Math.PI]

    CollisionLoop:
    for(var CollisionDistanceScale = 1.0; CollisionDistanceScale <= MaxCollisionDistanceScale; CollisionDistanceScale++){

        for(var j = 0; j < AngleList.length; j++){

            var angle = NextBallAngle + AngleList[j]
            var velocity = game.ballVelocityHS*CollisionDistanceScale
            var ballXHS = game.ballXHS + Math.cos(angle)*velocity
            var ballYVS = game.ballYVS - Math.sin(angle)*velocity
            var accepted = true

            // 以下の条件を満たしている場合、ボールは直進する
            // 満たしていない場合は、acceptedが偽となり、ボールの方向が変わる

            // 条件1 : 枠の外に出ていないか?
            if(ballXHS < 0.0 || ballXHS > 1.0 || ballYVS < 0.0 || ballYVS > 1.0){
                accepted = false
                // 枠の底にいる場合(=ボールを取りこぼした場合)は、当たり判定ループから抜け、処理を行う
                if (ballYVS > game.paddleYVS) {
                    pickFallenBall()
                    break CollisionLoop
                }
                
            }

            // 条件2 : ブロックに当たっていないか?
            for(var y = 0; y<game.blocksNum.y; y++){
                for(var x = 0; x<game.blocksNum.x; x++){
                    if(game.blocks[y][x].available == false) continue;
                    if((ballXHS > game.blocks[y][x].xHS) && (ballXHS < game.blocks[y][x].xHS + game.blocks[y][x].widthHS) &&
                        (ballYVS > game.blocks[y][x].yVS) && (ballYVS < game.blocks[y][x].yVS + game.blocks[y][x].heightVS) ){

                        accepted = false
                        // 当たっている場合は、ついでにブロック破壊処理もリクエストする
                        brokenBlocksList.push({x:x, y:y})
                    }
                }
            }

            // 条件3 : パドルに当たっていないか?
            if(
                (ballXHS > game.paddleXHS) && (ballXHS < game.paddleXHS + game.paddleWidthHS) &&
                (ballYVS > game.paddleYVS) && (ballYVS < game.paddleYVS + game.paddleHeightVS) ){
                accepted = false
            }

            if(accepted == true){
                NextBallAngle = angle
                NextBallXHS = ballXHS
                NextBallYVS = ballYVS
                break CollisionLoop
            }
        }

        if(CollisionDistanceScale == MaxCollisionDistanceScale){
            return
        }
    }

    game.ballXHS = NextBallXHS
    game.ballYVS = NextBallYVS
    game.ballAngle = NextBallAngle
    
    for(var i = 0; i < brokenBlocksList.length; i++){
        var place = brokenBlocksList[i]
        breakBlock(place.x, place.y)
    }

}

// 全体の描画処理
function draw() {

    if(game.rightPressed && game.paddleXHS < 1.0-game.paddleWidthHS) {
        game.paddleXHS += game.paddleSpeedHS;
    }
    else if(game.leftPressed && game.paddleXHS > 0) {
        game.paddleXHS -= game.paddleSpeedHS;
    }

    if(game.ballReleased == true) {
        moveBall()
    } else {
        set_ball()
    }

    screen.ctx.clearRect(0, 0, screen.canvas.width, screen.canvas.height);
    drawBall();
    drawPaddle();
    drawBlocks();
}


function keyDownHandler(e) {
    if(e.key == "Up" || e.key == "ArrowUp") {
        game.ballReleased = true;
    }
    if(e.key == "Right" || e.key == "ArrowRight") {
        game.rightPressed = true;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        game.leftPressed = true;
    }
}

function keyUpHandler(e) {
    if(e.key == "Right" || e.key == "ArrowRight") {
        game.rightPressed = false;
    }
    else if(e.key == "Left" || e.key == "ArrowLeft") {
        game.leftPressed = false;
    }
}

function main(){

    screen.width_aspect = 4
    screen.height_aspect = 5
    screen.resize_scale = 1.0
    screen.canvas_margin_scale = 0.1
    screen.canvas = document.getElementById("canvas_src");
    screen.ctx = screen.canvas.getContext("2d");
    set_screen()
    screen.canvas.start_width  = screen.canvas.width
    screen.canvas.start_height = screen.canvas.height

    set_game()
    // イベントハンドラの追加
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);

    window.addEventListener("resize", function(event){
        set_screen()
        screen.resize_scale = screen.canvas.width/screen.canvas.start_width
        draw()
    })

    // ループ処理の定義
    setInterval(draw, 10);
}

function set_blocks(){
    for(var y = 0; y<game.blocksNum.y; y++){
        game.blocks.push([])
        for(var x = 0; x<game.blocksNum.x; x++){
            game.blocks[y].push({
                xHS : x/game.blocksNum.x,
                yVS : y/game.blocksNum.y*game.blocksHeightVS,
                widthHS  : 1.0/game.blocksNum.x,
                heightVS : 1.0/game.blocksNum.y*game.blocksHeightVS,
                available: true,
            })
        }
    }
}

function set_ball(){
    game.ballXHS = game.paddleXHS + game.paddleWidthHS*0.5;
    game.ballYVS = game.paddleYVS;
    game.ballAngle = Math.PI*0.2;
    game.ballVelocityHS = 0.008;
    game.ballReleased = false;
}

function set_game(){

    game.ballRadiusHS = 0.02;
    game.paddleWidthHS = 0.15;
    game.paddleHeightVS = 0.02;
    game.paddleXHS = 0.5 - game.paddleWidthHS*0.5;
    game.paddleYVS = 0.9;
    game.paddleSpeedHS = 0.01;

    game.blocks = []
    game.blocksNum = {x:8, y:8};
    game.blocksHeightVS = 0.35;
    game.blocksMarginHS = 0.005;

    game.rightPressed = false;
    game.leftPressed = false;
    
    set_ball()
    set_blocks()
}

function set_screen(){

    // canvas に関する設定 (HTMLの内容に反映される)
    screen.canvas.width =
        Math.min(window.innerWidth, window.innerHeight/screen.height_aspect*screen.width_aspect) * (1.0-screen.canvas_margin_scale*2)
    screen.canvas.height =
        Math.min(window.innerHeight, window.innerWidth/screen.width_aspect*screen.height_aspect) * (1.0-screen.canvas_margin_scale*2)

    if(screen.canvas.width < 0.0 || screen.canvas.height < 0.0){
        screen.canvas.width = 0.0
        screen.canvas.height = 0.0
    }
    //screen.canvas.style.top  = ((window.innerHeight-screen.canvas.height)*0.5).toString() +"px"
    screen.canvas.style.left = ((window.innerWidth-screen.canvas.width)*0.5).toString() + "px"
    
}